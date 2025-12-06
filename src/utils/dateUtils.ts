import { differenceInDays, parseISO, format, isToday, isTomorrow, isPast } from 'date-fns'
import type { TaskDue } from '../api/types'

export function getDueDateDisplay(due: TaskDue | null): string | null {
  if (!due) return null

  const dueDate = parseISO(due.date)

  if (isToday(dueDate)) return 'Today'
  if (isTomorrow(dueDate)) return 'Tomorrow'

  const daysUntil = differenceInDays(dueDate, new Date())

  if (isPast(dueDate) && !isToday(dueDate)) {
    return format(dueDate, 'MMM d') // Overdue
  }

  if (daysUntil <= 3) {
    return format(dueDate, 'EEE') // Show day name for tasks due soon
  }

  return format(dueDate, 'MMM d')
}

export function isTaskDueSoon(due: TaskDue | null): boolean {
  if (!due) return true // No due date = show in section

  const dueDate = parseISO(due.date)
  const daysUntil = differenceInDays(dueDate, new Date())

  return daysUntil <= 3 || isPast(dueDate)
}

export function isOverdue(due: TaskDue | null): boolean {
  if (!due) return false

  const dueDate = parseISO(due.date)
  return isPast(dueDate) && !isToday(dueDate)
}
