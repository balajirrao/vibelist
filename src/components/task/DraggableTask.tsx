import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task as TaskType } from '../../api/types'
import { Task } from './Task'

interface DraggableTaskProps {
  task: TaskType
  allTasks: TaskType[]
  subtasks: TaskType[]
}

export function DraggableTask({ task, allTasks, subtasks }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'dragging' : ''}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div className="drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </div>
        <div style={{ flex: 1 }}>
          <Task task={task} allTasks={allTasks} subtasks={subtasks} />
        </div>
      </div>
    </div>
  )
}
