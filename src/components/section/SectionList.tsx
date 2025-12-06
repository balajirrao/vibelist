import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useSections } from '../../hooks/useSections'
import { useTasks, useTasksBySection } from '../../hooks/useTasks'
import { useMoveTask } from '../../hooks/useTaskMutations'
import { Section } from './Section'
import type { Task } from '../../api/types'

export function SectionList() {
  const { data: sections, isLoading: sectionsLoading } = useSections()
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const { scheduled, bySectionId, noSection } = useTasksBySection(tasks)
  const { mutate: moveTask } = useMoveTask()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: { active: { data: { current?: { task?: Task } } } }) => {
    const task = event.active.data.current?.task
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData?.task) return

    // Check if dropped on a section
    if (overData?.type === 'section') {
      const targetSectionId = overData.sectionId as string
      const currentSectionId = activeData.task.section_id

      // Don't allow dropping in scheduled section (virtual)
      if (targetSectionId === 'scheduled') return

      // Handle 'no-section' as null
      const newSectionId = targetSectionId === 'no-section' ? null : targetSectionId

      if (currentSectionId !== newSectionId) {
        moveTask({
          taskId: active.id as string,
          sectionId: newSectionId,
        })
      }
    }
  }

  if (sectionsLoading || tasksLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="section-list">
        {/* Scheduled section (virtual) */}
        {scheduled.length > 0 && (
          <Section
            section={{ id: 'scheduled', project_id: '', name: 'Scheduled', order: -1 }}
            tasks={scheduled}
            allTasks={tasks || []}
            isVirtual
          />
        )}

        {/* Tasks without section */}
        <Section
          section={{ id: 'no-section', project_id: '', name: 'No Section', order: 0 }}
          tasks={noSection}
          allTasks={tasks || []}
        />

        {/* Regular sections */}
        {sections?.map((section) => (
          <Section
            key={section.id}
            section={section}
            tasks={bySectionId[section.id] || []}
            allTasks={tasks || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="task dragging" style={{ background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div className="task-main">
              <div className="task-row">
                <span className="task-content">{activeTask.content}</span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
