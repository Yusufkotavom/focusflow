import { isBefore, startOfDay } from 'date-fns'

type TaskBase = {
  id: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  defer_date?: string | null
  blocked: boolean
  project_id?: string | null
  parent_task_id?: string | null
}

type ProjectBase = {
  id: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'sequential' | 'parallel' | 'single'
}

export function isTaskAvailable(
  task: TaskBase, 
  projects: Record<string, ProjectBase>, 
  allTasks: TaskBase[]
): boolean {
  // 1. Basic Status Check
  if (task.status !== 'active') return false

  // 2. Blocked Field Check
  if (task.blocked) return false

  // 3. Defer Date Check
  if (task.defer_date) {
    const deferDate = startOfDay(new Date(task.defer_date))
    const today = startOfDay(new Date())
    // If defer date is strictly in the future (after today)
    if (isBefore(today, deferDate)) {
      return false
    }
  }

  // 4. Project Check
  if (task.project_id) {
    const project = projects[task.project_id]
    if (!project) return false // Orphaned task
    
    if (project.status !== 'active') return false

    // 5. Sequential Logic
    if (project.type === 'sequential') {
      // Find all active/inbox tasks for this project
      const projectTasks = allTasks.filter(
        t => t.project_id === task.project_id && 
        (t.status === 'active' || t.status === 'inbox') && 
        t.parent_task_id === task.parent_task_id
      )
      
      // Assumes tasks are sorted by order/creation
      // The task is only available if it's the FIRST incomplete task in the project
      if (projectTasks.length > 0 && projectTasks[0].id !== task.id) {
        return false
      }
    }
  }

  return true
}
