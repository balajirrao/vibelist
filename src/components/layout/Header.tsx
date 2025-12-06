import { useState, useRef, useEffect } from 'react'
import { ProjectSelector } from '../project/ProjectSelector'
import { SyncStatus } from '../sync/SyncStatus'
import { useProjects } from '../../hooks/useProjects'
import { useProjectStore } from '../../store/projectStore'

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: projects } = useProjects()
  const selectedId = useProjectStore((s) => s.selectedProjectId)

  const selectedProject = projects?.find((p) => p.id === selectedId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSettingsOpen])

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">{selectedProject?.name || 'Select a project'}</h1>
        <SyncStatus />
        <div className="settings-container" ref={dropdownRef}>
          <button
            className="settings-button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          {isSettingsOpen && (
            <div className="settings-dropdown">
              <label className="settings-label">Project</label>
              <ProjectSelector onSelect={() => setIsSettingsOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
