import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { operationQueue, type QueuedOperation, type QueueItem } from '../services/operationQueue'
import { useAuthStore } from '../store/authStore'
import { useProjectStore } from '../store/projectStore'

interface QueueStatus {
  pending: number
  failed: number
  isProcessing: boolean
  isOnline: boolean
}

export function useOperationQueue() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<QueueStatus>({
    pending: 0,
    failed: 0,
    isProcessing: false,
    isOnline: navigator.onLine,
  })

  const updateStatus = useCallback(async () => {
    const counts = await operationQueue.getCount()
    setStatus({
      pending: counts.pending,
      failed: counts.failed,
      isProcessing: operationQueue.isProcessing(),
      isOnline: navigator.onLine,
    })
  }, [])

  useEffect(() => {
    updateStatus()

    const unsubscribe = operationQueue.subscribe(() => {
      updateStatus()
      // Invalidate queries when queue changes (operations complete)
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      }
    })

    const handleOnline = () => {
      setStatus((s) => ({ ...s, isOnline: true }))
      if (token) {
        operationQueue.processQueue(token)
      }
    }

    const handleOffline = () => {
      setStatus((s) => ({ ...s, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateStatus, projectId, queryClient, token])

  const enqueue = useCallback(
    async (operation: QueuedOperation) => {
      await operationQueue.enqueue(operation, projectId)
    },
    [projectId]
  )

  const retryFailed = useCallback(async () => {
    await operationQueue.retryFailed()
  }, [])

  const clearFailed = useCallback(async () => {
    await operationQueue.clearFailed()
  }, [])

  const clearPending = useCallback(async () => {
    await operationQueue.clearPending()
  }, [])

  const clearAll = useCallback(async () => {
    await operationQueue.clearAll()
  }, [])

  const getPendingItems = useCallback(async (): Promise<QueueItem[]> => {
    return operationQueue.getAll()
  }, [])

  const processNow = useCallback(async () => {
    if (token) {
      await operationQueue.processQueue(token)
    }
  }, [token])

  return {
    status,
    enqueue,
    retryFailed,
    clearFailed,
    clearPending,
    clearAll,
    getPendingItems,
    processNow,
  }
}
