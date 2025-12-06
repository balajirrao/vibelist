import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { TodoistAPI } from '../api/todoist'

export function useProjects() {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!token) return []
      const api = new TodoistAPI(token)
      const projects = await api.getProjects()
      return projects.sort((a, b) => a.order - b.order)
    },
    enabled: !!token,
  })
}
