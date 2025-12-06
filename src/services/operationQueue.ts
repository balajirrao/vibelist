import { TodoistAPI } from '../api/todoist'
import type { CreateTaskRequest, UpdateTaskRequest } from '../api/types'

// Operation types that can be queued
export type QueuedOperation =
  | { type: 'createTask'; payload: CreateTaskRequest }
  | { type: 'updateTask'; payload: { taskId: string; data: UpdateTaskRequest } }
  | { type: 'closeTask'; payload: { taskId: string } }
  | { type: 'reopenTask'; payload: { taskId: string } }

export interface QueueItem {
  id: string
  operation: QueuedOperation
  timestamp: number
  retries: number
  status: 'pending' | 'processing' | 'failed'
  projectId: string | null
}

const DB_NAME = 'vibelist-queue'
const DB_VERSION = 1
const STORE_NAME = 'operations'
const MAX_RETRIES = 3
const RETRY_DELAY = 2000

class OperationQueue {
  private db: IDBDatabase | null = null
  private processing = false
  private listeners: Set<() => void> = new Set()

  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async enqueue(
    operation: QueuedOperation,
    projectId: string | null
  ): Promise<string> {
    await this.init()

    const item: QueueItem = {
      id: this.generateId(),
      operation,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      projectId,
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.add(item)

      request.onsuccess = () => {
        this.notifyListeners()
        this.processQueue()
        resolve(item.id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(): Promise<QueueItem[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getPending(): Promise<QueueItem[]> {
    const all = await this.getAll()
    return all
      .filter((item) => item.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  async getCount(): Promise<{ pending: number; failed: number }> {
    const all = await this.getAll()
    return {
      pending: all.filter((i) => i.status === 'pending' || i.status === 'processing').length,
      failed: all.filter((i) => i.status === 'failed').length,
    }
  }

  private async updateItem(item: QueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(item)

      request.onsuccess = () => {
        this.notifyListeners()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  private async removeItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        this.notifyListeners()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearFailed(): Promise<void> {
    const all = await this.getAll()
    const failed = all.filter((i) => i.status === 'failed')
    for (const item of failed) {
      await this.removeItem(item.id)
    }
  }

  async retryFailed(): Promise<void> {
    const all = await this.getAll()
    const failed = all.filter((i) => i.status === 'failed')
    for (const item of failed) {
      item.status = 'pending'
      item.retries = 0
      await this.updateItem(item)
    }
    this.processQueue()
  }

  private async executeOperation(
    operation: QueuedOperation,
    token: string
  ): Promise<void> {
    const api = new TodoistAPI(token)

    switch (operation.type) {
      case 'createTask':
        await api.createTask(operation.payload)
        break
      case 'updateTask':
        await api.updateTask(operation.payload.taskId, operation.payload.data)
        break
      case 'closeTask':
        await api.closeTask(operation.payload.taskId)
        break
      case 'reopenTask':
        await api.reopenTask(operation.payload.taskId)
        break
    }
  }

  async processQueue(token?: string): Promise<void> {
    if (this.processing) return
    if (!navigator.onLine) return

    // Get token from localStorage if not provided
    const authToken = token || this.getStoredToken()
    if (!authToken) return

    this.processing = true
    this.notifyListeners()

    try {
      const pending = await this.getPending()

      for (const item of pending) {
        // Check if still online
        if (!navigator.onLine) break

        item.status = 'processing'
        await this.updateItem(item)

        try {
          await this.executeOperation(item.operation, authToken)
          await this.removeItem(item.id)
        } catch (error) {
          console.error('Queue operation failed:', error)
          item.retries++

          if (item.retries >= MAX_RETRIES) {
            item.status = 'failed'
          } else {
            item.status = 'pending'
            // Wait before next retry
            await new Promise((r) => setTimeout(r, RETRY_DELAY))
          }

          await this.updateItem(item)
        }
      }
    } finally {
      this.processing = false
      this.notifyListeners()
    }
  }

  private getStoredToken(): string | null {
    try {
      const stored = localStorage.getItem('vibelist-auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.state?.token || null
      }
    } catch {
      // Ignore parsing errors
    }
    return null
  }

  isProcessing(): boolean {
    return this.processing
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l())
  }
}

// Singleton instance
export const operationQueue = new OperationQueue()

// Initialize and set up online listener
if (typeof window !== 'undefined') {
  operationQueue.init()

  window.addEventListener('online', () => {
    operationQueue.processQueue()
  })
}
