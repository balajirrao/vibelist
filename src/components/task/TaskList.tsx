import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { Task as TaskType } from '../../api/types'
import { DraggableTask } from './DraggableTask'

interface TaskListProps {
  tasks: TaskType[]
  allTasks: TaskType[]
  sectionId: string
  isVirtual?: boolean
}

export function TaskList({ tasks, allTasks, sectionId, isVirtual }: TaskListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${sectionId}`,
    data: {
      type: 'section',
      sectionId,
    },
  })

  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      ref={setNodeRef}
      className={`task-list ${isOver ? 'drag-over' : ''}`}
      style={{ minHeight: tasks.length === 0 ? '60px' : undefined }}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => {
          const subtasks = allTasks.filter((t) => t.parent_id === task.id)
          return (
            <DraggableTask
              key={task.id}
              task={task}
              allTasks={allTasks}
              subtasks={subtasks}
            />
          )
        })}
      </SortableContext>
      {tasks.length === 0 && !isVirtual && (
        <div className="empty-state" style={{ padding: '16px', color: '#9ca3af' }}>
          Drop tasks here
        </div>
      )}
    </div>
  )
}
