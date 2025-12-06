export interface Project {
  id: string
  name: string
  color: string
  order: number
  is_favorite: boolean
}

export interface Section {
  id: string
  project_id: string
  name: string
  order: number
}

export interface TaskDue {
  date: string
  datetime?: string
  string: string
  is_recurring: boolean
}

export interface Task {
  id: string
  project_id: string
  section_id: string | null
  parent_id: string | null
  content: string
  description: string
  is_completed: boolean
  order: number
  priority: number
  due: TaskDue | null
  labels: string[]
}

export interface CreateTaskRequest {
  content: string
  project_id?: string
  section_id?: string
  parent_id?: string
  due_date?: string
}

export interface UpdateTaskRequest {
  content?: string
  section_id?: string
}
