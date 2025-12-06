import type { Project, Section, Task, CreateTaskRequest, UpdateTaskRequest } from './types'

const API_BASE = 'https://api.todoist.com/rest/v2'

export class TodoistAPI {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects')
  }

  async getSections(projectId: string): Promise<Section[]> {
    return this.request<Section[]>(`/sections?project_id=${projectId}`)
  }

  async getTasks(projectId: string): Promise<Task[]> {
    return this.request<Task[]>(`/tasks?project_id=${projectId}`)
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    console.log('[API] createTask payload:', data)
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    console.log('[API] updateTask payload:', { taskId, data })
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async closeTask(taskId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/close`, { method: 'POST' })
  }

  async reopenTask(taskId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/reopen`, { method: 'POST' })
  }
}
