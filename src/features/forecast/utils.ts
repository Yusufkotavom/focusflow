import {
  addDays,
  format,
  isAfter,
  isSameDay,
  startOfDay,
} from 'date-fns'
import { isTaskAvailable, isTaskDueToday, isTaskOverdue, isTaskPlannedForToday } from '@/features/tasks/utils/availability'

type Task = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
  project_id?: string | null
  blocked: boolean
  parent_task_id?: string | null
}

type Project = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'sequential' | 'parallel' | 'single'
}

type ForecastSection = {
  key: string
  title: string
  tasks: Task[]
}

export function buildForecastSections(tasks: Task[], projects: Project[]): ForecastSection[] {
  const projectsMap = projects.reduce<Record<string, Project>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const nextWeek = addDays(today, 7)

  const overdue = tasks.filter((task) => isTaskOverdue(task))
  const todayTasks = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'dropped') return false
    return isTaskDueToday(task) || isTaskPlannedForToday(task)
  })
  const tomorrowTasks = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'dropped') return false

    const dates = [task.due_date, task.planned_date, task.defer_date].filter(Boolean).map((date) => new Date(date as string))
    return dates.some((date) => isSameDay(startOfDay(date), tomorrow))
  })
  const nextSevenDaysTasks = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'dropped') return false

    const dates = [task.due_date, task.planned_date, task.defer_date].filter(Boolean).map((date) => startOfDay(new Date(date as string)))
    return dates.some((date) => isAfter(date, tomorrow) && !isAfter(date, nextWeek))
  })
  const availableToday = tasks.filter((task) => isTaskAvailable(task, projectsMap, tasks))
  const future = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'dropped') return false

    const dates = [task.due_date, task.planned_date, task.defer_date].filter(Boolean).map((date) => startOfDay(new Date(date as string)))
    return dates.some((date) => isAfter(date, nextWeek))
  })

  return [
    { key: 'overdue', title: `Overdue (${overdue.length})`, tasks: overdue },
    { key: 'today', title: `Today (${todayTasks.length})`, tasks: todayTasks },
    { key: 'available', title: `Available Today (${availableToday.length})`, tasks: availableToday },
    { key: 'tomorrow', title: `Tomorrow (${tomorrowTasks.length})`, tasks: tomorrowTasks },
    { key: 'next-7-days', title: `Next 7 Days (${nextSevenDaysTasks.length})`, tasks: nextSevenDaysTasks },
    { key: 'future', title: `Future (${future.length})`, tasks: future },
  ].filter((section) => section.tasks.length > 0)
}

export function forecastDateLabel(task: Task) {
  if (task.due_date) return `Due ${format(new Date(task.due_date), 'MMM d')}`
  if (task.planned_date) return `Planned ${format(new Date(task.planned_date), 'MMM d')}`
  if (task.defer_date) return `Starts ${format(new Date(task.defer_date), 'MMM d')}`
  return 'Available'
}
