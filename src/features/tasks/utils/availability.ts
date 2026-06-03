import { isBefore, startOfDay } from 'date-fns'

type TaskBase = {
  id: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  defer_date?: string | null
  project_id?: string | null
  parent_task_id?: string | null
  order?: number | null
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

  // 2. Defer Date Check
  if (task.defer_date) {
    const deferDate = startOfDay(new Date(task.defer_date))
    const today = startOfDay(new Date())
    // If defer date is strictly in the future (after today)
    if (isBefore(today, deferDate)) {
      return false
    }
  }

  // 3. Project Check
  if (task.project_id) {
    const project = projects[task.project_id]
    if (!project) return false // Orphaned task
    
    if (project.status !== 'active') return false

    // 4. Sequential Logic
    if (project.type === 'sequential') {
      // Find all active/inbox tasks for this project
      const projectTasks = allTasks.filter(
        t => t.project_id === task.project_id && 
        (t.status === 'active' || t.status === 'inbox') && 
        t.parent_task_id === task.parent_task_id
      ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      
      // Assumes tasks are sorted by order/creation
      // The task is only available if it's the FIRST incomplete task in the project
      if (projectTasks.length > 0 && projectTasks[0].id !== task.id) {
        return false
      }
    }
  }

  return true
}

export function isTaskVisibleForProjectType(
  task: TaskBase,
  projects: Record<string, ProjectBase>,
  allTasks: TaskBase[]
): boolean {
  if (!task.project_id) return true

  const project = projects[task.project_id]
  if (!project) return true

  if (project.type !== 'sequential') return true
  if (task.status === 'completed' || task.status === 'dropped') return true

  const projectTasks = allTasks
    .filter(
      (candidate) =>
        candidate.project_id === task.project_id &&
        (candidate.status === 'active' || candidate.status === 'inbox') &&
        candidate.parent_task_id === task.parent_task_id
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return projectTasks.length === 0 || projectTasks[0].id === task.id
}

export function isTaskOverdue(task: { status: string; due_date?: string | null }) {
  if (task.status === 'completed' || !task.due_date) return false

  const dueDate = startOfDay(new Date(task.due_date))
  const today = startOfDay(new Date())
  return isBefore(dueDate, today)
}

export function isTaskPlannedForToday(task: { planned_date?: string | null }) {
  if (!task.planned_date) return false
  return startOfDay(new Date(task.planned_date)).getTime() === startOfDay(new Date()).getTime()
}

export function isTaskDueToday(task: { due_date?: string | null }) {
  if (!task.due_date) return false
  return startOfDay(new Date(task.due_date)).getTime() === startOfDay(new Date()).getTime()
}
