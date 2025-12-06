import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useProjectStore } from '../store/projectStore'
import { TodoistAPI } from '../api/todoist'

export function useSections() {
  const token = useAuthStore((s) => s.token)
  const projectId = useProjectStore((s) => s.selectedProjectId)

  return useQuery({
    queryKey: ['sections', projectId],
    queryFn: async () => {
      if (!token || !projectId) return []
      const api = new TodoistAPI(token)
      const sections = await api.getSections(projectId)
      return sections.sort((a, b) => a.order - b.order)
    },
    enabled: !!token && !!projectId,
  })
}
