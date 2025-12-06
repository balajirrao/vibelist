import type { Task } from '../api/types'

export interface TaskNode extends Task {
  children: TaskNode[]
}

export function buildTaskTree(tasks: Task[]): TaskNode[] {
  const taskMap = new Map<string, TaskNode>()
  const roots: TaskNode[] = []

  // First pass: create nodes
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  // Second pass: build tree
  tasks.forEach((task) => {
    const node = taskMap.get(task.id)!

    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id)!.children.push(node)
    } else if (!task.parent_id) {
      roots.push(node)
    }
  })

  // Sort by order at each level
  const sortByOrder = (nodes: TaskNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach((node) => sortByOrder(node.children))
  }

  sortByOrder(roots)
  return roots
}

export function getSubtaskIds(taskId: string, tasks: Task[]): string[] {
  return tasks
    .filter((t) => t.parent_id === taskId)
    .map((t) => t.id)
}

export function getCompletedSubtaskIds(taskId: string, tasks: Task[]): string[] {
  return tasks
    .filter((t) => t.parent_id === taskId && t.is_completed)
    .map((t) => t.id)
}
