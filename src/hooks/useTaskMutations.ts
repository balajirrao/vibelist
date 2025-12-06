import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useProjectStore } from '../store/projectStore'
import { TodoistAPI } from '../api/todoist'
import { operationQueue } from '../services/operationQueue'
import type { Task, CreateTaskRequest } from '../api/types'

export function useCreateTask() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      if (!token) throw new Error('No token')

      const payload = { ...data, project_id: projectId || undefined }

      // If offline, queue the operation
      if (!navigator.onLine) {
        await operationQueue.enqueue({ type: 'createTask', payload }, projectId)
        return null // Return null to indicate queued
      }

      // Try to execute directly
      const api = new TodoistAPI(token)
      try {
        return await api.createTask(payload)
      } catch (error) {
        // On failure, queue for retry
        await operationQueue.enqueue({ type: 'createTask', payload }, projectId)
        throw error
      }
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

      const payload = {
        taskId,
        data: { section_id: sectionId || undefined },
      }

      // If offline, queue the operation
      if (!navigator.onLine) {
        await operationQueue.enqueue({ type: 'updateTask', payload }, projectId)
        return null
      }

      const api = new TodoistAPI(token)
      try {
        return await api.updateTask(taskId, { section_id: sectionId || undefined })
      } catch (error) {
        // On failure, queue for retry
        await operationQueue.enqueue({ type: 'updateTask', payload }, projectId)
        throw error
      }
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
      // Don't rollback if we queued the operation - the optimistic update should persist
      if (!navigator.onLine) return

      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
    },
    onSettled: () => {
      // Only invalidate if online - offline changes will sync later
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      }
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

      // If offline, queue all operations
      if (!navigator.onLine) {
        await operationQueue.enqueue(
          { type: 'closeTask', payload: { taskId } },
          projectId
        )

        // If recurring, queue reopen for completed subtasks
        if (isRecurring && completedSubtaskIds.length > 0) {
          for (const id of completedSubtaskIds) {
            await operationQueue.enqueue(
              { type: 'reopenTask', payload: { taskId: id } },
              projectId
            )
          }
        }
        return
      }

      const api = new TodoistAPI(token)

      try {
        await api.closeTask(taskId)

        // If recurring, reopen all completed subtasks
        if (isRecurring && completedSubtaskIds.length > 0) {
          await Promise.all(
            completedSubtaskIds.map((id) => api.reopenTask(id))
          )
        }
      } catch (error) {
        // Queue the failed operations
        await operationQueue.enqueue(
          { type: 'closeTask', payload: { taskId } },
          projectId
        )
        throw error
      }
    },
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId])

      // Optimistically mark task as completed
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((task) =>
          task.id === taskId ? { ...task, is_completed: true } : task
        )
      )

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (!navigator.onLine) return

      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      }
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

      // If offline, queue the operation
      if (!navigator.onLine) {
        await operationQueue.enqueue(
          { type: 'reopenTask', payload: { taskId } },
          projectId
        )
        return
      }

      const api = new TodoistAPI(token)
      try {
        return await api.reopenTask(taskId)
      } catch (error) {
        await operationQueue.enqueue(
          { type: 'reopenTask', payload: { taskId } },
          projectId
        )
        throw error
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId])

      // Optimistically mark task as not completed
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((task) =>
          task.id === taskId ? { ...task, is_completed: false } : task
        )
      )

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (!navigator.onLine) return

      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      }
    },
  })
}
