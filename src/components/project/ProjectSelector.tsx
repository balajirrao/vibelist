import { useEffect } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { useProjectStore } from '../../store/projectStore'

export function ProjectSelector() {
  const { data: projects, isLoading } = useProjects()
  const selectedId = useProjectStore((s) => s.selectedProjectId)
  const setSelectedId = useProjectStore((s) => s.setSelectedProjectId)

  useEffect(() => {
    if (!selectedId && projects?.length) {
      setSelectedId(projects[0].id)
    }
  }, [projects, selectedId, setSelectedId])

  if (isLoading) {
    return <div className="loading">Loading projects...</div>
  }

  if (!projects?.length) {
    return <div className="empty-state">No projects found</div>
  }

  return (
    <select
      className="project-selector"
      value={selectedId || ''}
      onChange={(e) => setSelectedId(e.target.value)}
    >
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  )
}
