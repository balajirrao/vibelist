import { useState } from 'react'
import type { Section as SectionType, Task } from '../../api/types'
import { TaskList } from '../task/TaskList'
import { AddTaskForm } from '../task/AddTaskForm'

interface SectionProps {
  section: SectionType
  tasks: Task[]
  allTasks: Task[]
  isVirtual?: boolean
}

export function Section({ section, tasks, allTasks, isVirtual }: SectionProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)

  return (
    <div className={`section ${isVirtual ? 'scheduled' : ''}`}>
      <div className="section-header">
        <h2>{section.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tasks.length > 0 && (
            <span className="task-count">{tasks.length}</span>
          )}
          {!isVirtual && (
            <button
              className="add-button"
              onClick={() => setIsAddingTask(true)}
              aria-label={`Add task to ${section.name}`}
            >
              +
            </button>
          )}
        </div>
      </div>

      {isAddingTask && (
        <AddTaskForm
          sectionId={section.id}
          onClose={() => setIsAddingTask(false)}
        />
      )}

      <TaskList
        tasks={tasks}
        allTasks={allTasks}
        sectionId={section.id}
        isVirtual={isVirtual}
      />
    </div>
  )
}
