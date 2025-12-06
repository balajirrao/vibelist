import { useState, type FormEvent } from 'react'
import { useCreateTask } from '../../hooks/useTaskMutations'

interface AddTaskFormProps {
  sectionId?: string
  parentId?: string
  onClose: () => void
}

export function AddTaskForm({ sectionId, parentId, onClose }: AddTaskFormProps) {
  const [content, setContent] = useState('')
  const { mutate: createTask, isPending } = useCreateTask()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    createTask(
      {
        content: content.trim(),
        section_id: sectionId === 'no-section' ? undefined : sectionId,
        parent_id: parentId,
      },
      {
        onSuccess: () => {
          setContent('')
          onClose()
        },
      }
    )
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="add-task-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Add subtask...' : 'Add task...'}
        autoFocus
      />
      <div className="add-task-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || !content.trim()}
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
