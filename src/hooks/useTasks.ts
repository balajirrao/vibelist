import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useProjectStore } from '../store/projectStore'
import { useUIStore } from '../store/uiStore'
import { TodoistAPI } from '../api/todoist'
import type { Task } from '../api/types'

export function useTasks() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const initializeCollapsed = useUIStore((s) => s.initializeCollapsed)

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!token || !projectId) return []
      const api = new TodoistAPI(token)
      const tasks = await api.getTasks(projectId)
      return tasks.sort((a, b) => a.order - b.order)
    },
    enabled: !!token && !!projectId,
  })

  // Initialize all tasks with subtasks as collapsed
  useEffect(() => {
    if (query.data) {
      const tasksWithSubtasks = query.data
        .filter((task) => query.data.some((t) => t.parent_id === task.id))
        .map((t) => t.id)
      initializeCollapsed(tasksWithSubtasks)
    }
  }, [query.data, initializeCollapsed])

  return query
}

export function useTasksBySection(tasks: Task[] | undefined) {
  return useMemo(() => {
    if (!tasks) return { scheduled: [], bySectionId: {}, noSection: [] }

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const scheduled: Task[] = []
    const bySectionId: Record<string, Task[]> = {}
    const noSection: Task[] = []

    tasks.forEach((task) => {
      // Skip subtasks for top-level organization
      if (task.parent_id) return

      // Check if task is scheduled (due date > 3 days from now)
      if (task.due && !task.is_completed) {
        const dueDate = new Date(task.due.date)
        if (dueDate > threeDaysFromNow) {
          scheduled.push(task)
          return
        }
      }

      // Organize by section
      if (task.section_id) {
        if (!bySectionId[task.section_id]) {
          bySectionId[task.section_id] = []
        }
        bySectionId[task.section_id].push(task)
      } else {
        noSection.push(task)
      }
    })

    return { scheduled, bySectionId, noSection }
  }, [tasks])
}

export function useSubtasks(parentId: string, tasks: Task[] | undefined) {
  return useMemo(() => {
    if (!tasks) return []
    return tasks
      .filter((t) => t.parent_id === parentId)
      .sort((a, b) => a.order - b.order)
  }, [tasks, parentId])
}
