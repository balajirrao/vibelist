import { useState } from 'react'
import type { Task as TaskType } from '../../api/types'
import { useUIStore } from '../../store/uiStore'
import { useCompleteTask, useReopenTask } from '../../hooks/useTaskMutations'
import { getDueDateDisplay, isOverdue } from '../../utils/dateUtils'
import { getCompletedSubtaskIds } from '../../utils/taskUtils'
import { AddTaskForm } from './AddTaskForm'

interface TaskProps {
  task: TaskType
  allTasks: TaskType[]
  subtasks: TaskType[]
  level?: number
}

export function Task({ task, allTasks, subtasks, level = 0 }: TaskProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const isCollapsed = useUIStore((s) => s.collapsedTasks.has(task.id))
  const toggleCollapse = useUIStore((s) => s.toggleTaskCollapse)

  const { mutate: completeTask } = useCompleteTask()
  const { mutate: reopenTask } = useReopenTask()

  const hasSubtasks = subtasks.length > 0
  const dueDateDisplay = getDueDateDisplay(task.due)
  const isTaskOverdue = isOverdue(task.due)

  const handleToggleComplete = () => {
    if (task.is_completed) {
      reopenTask(task.id)
    } else {
      const completedSubtaskIds = getCompletedSubtaskIds(task.id, allTasks)
      completeTask({
        taskId: task.id,
        isRecurring: task.due?.is_recurring || false,
        completedSubtaskIds,
      })
    }
  }

  return (
    <div className={`task ${task.is_completed ? 'completed' : ''}`}>
      <div className="task-main">
        <div className="task-row">
          <button
            className={`checkbox ${task.is_completed ? 'checked' : ''}`}
            onClick={handleToggleComplete}
            aria-label={task.is_completed ? 'Reopen task' : 'Complete task'}
          />

          {hasSubtasks && (
            <button
              className="collapse-toggle"
              onClick={() => toggleCollapse(task.id)}
              aria-label={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}

          <span className={`task-content ${task.is_completed ? 'completed' : ''}`}>
            {task.content}
          </span>

          {dueDateDisplay && (
            <span className={`due-badge ${isTaskOverdue ? 'overdue' : ''}`}>
              {dueDateDisplay}
            </span>
          )}

          {level === 0 && (
            <button
              className="add-button"
              onClick={() => setIsAddingSubtask(true)}
              aria-label="Add subtask"
            >
              +
            </button>
          )}
        </div>

        {isAddingSubtask && (
          <div style={{ marginTop: '8px', marginLeft: '32px' }}>
            <AddTaskForm
              parentId={task.id}
              sectionId={task.section_id || undefined}
              onClose={() => setIsAddingSubtask(false)}
            />
          </div>
        )}

        {hasSubtasks && !isCollapsed && (
          <div className="subtasks">
            {subtasks.map((subtask) => (
              <Task
                key={subtask.id}
                task={subtask}
                allTasks={allTasks}
                subtasks={allTasks.filter((t) => t.parent_id === subtask.id)}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
