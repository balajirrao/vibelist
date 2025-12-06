import { ProjectSelector } from '../project/ProjectSelector'

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <ProjectSelector />
      </div>
    </header>
  )
}
