import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useProjectStore } from '../store/projectStore'
import { TodoistAPI } from '../api/todoist'
import type { Task, CreateTaskRequest } from '../api/types'

export function useCreateTask() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      if (!token) throw new Error('No token')
      const api = new TodoistAPI(token)
      return api.createTask({ ...data, project_id: projectId || undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export function useMoveTask() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, sectionId }: { taskId: string; sectionId: string | null }) => {
      if (!token) throw new Error('No token')
      const api = new TodoistAPI(token)
      return api.updateTask(taskId, { section_id: sectionId || undefined })
    },
    onMutate: async ({ taskId, sectionId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId])

      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((task) =>
          task.id === taskId ? { ...task, section_id: sectionId } : task
        )
      )

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export function useCompleteTask() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      isRecurring,
      completedSubtaskIds
    }: {
      taskId: string
      isRecurring: boolean
      completedSubtaskIds: string[]
    }) => {
      if (!token) throw new Error('No token')
      const api = new TodoistAPI(token)

      await api.closeTask(taskId)

      // If recurring, reopen all completed subtasks
      if (isRecurring && completedSubtaskIds.length > 0) {
        await Promise.all(
          completedSubtaskIds.map((id) => api.reopenTask(id))
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export function useReopenTask() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!token) throw new Error('No token')
      const api = new TodoistAPI(token)
      return api.reopenTask(taskId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}
