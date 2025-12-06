import { create } from 'zustand'

interface UIStore {
  collapsedTasks: Set<string>
  expandedAddForms: Set<string>
  toggleTaskCollapse: (taskId: string) => void
  setTaskCollapsed: (taskId: string, collapsed: boolean) => void
  initializeCollapsed: (taskIds: string[]) => void
  toggleAddForm: (id: string) => void
  closeAddForm: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  collapsedTasks: new Set(),
  expandedAddForms: new Set(),

  toggleTaskCollapse: (taskId) => {
    set((state) => {
      const newSet = new Set(state.collapsedTasks)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return { collapsedTasks: newSet }
    })
  },

  setTaskCollapsed: (taskId, collapsed) => {
    set((state) => {
      const newSet = new Set(state.collapsedTasks)
      if (collapsed) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return { collapsedTasks: newSet }
    })
  },

  initializeCollapsed: (taskIds) => {
    set({ collapsedTasks: new Set(taskIds) })
  },

  toggleAddForm: (id) => {
    set((state) => {
      const newSet = new Set(state.expandedAddForms)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { expandedAddForms: newSet }
    })
  },

  closeAddForm: (id) => {
    set((state) => {
      const newSet = new Set(state.expandedAddForms)
      newSet.delete(id)
      return { expandedAddForms: newSet }
    })
  },
}))
