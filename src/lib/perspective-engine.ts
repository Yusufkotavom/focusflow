import { format, startOfDay } from 'date-fns'
import { isTaskAvailable } from '@/features/tasks/utils/availability'

export type PerspectiveGroupBy = 'none' | 'project' | 'status' | 'tag' | 'due' | 'planned' | 'defer'
export type PerspectiveSortBy = 'manual' | 'title' | 'created' | 'due' | 'planned' | 'defer'

export type PerspectiveRules = {
  flagged?: boolean
  noProject?: boolean
  deferred?: boolean
  available?: boolean
  statuses?: string[]
  hasRepeat?: boolean
}

export type PerspectiveDefinition = {
  id: string
  name: string
  description: string
  icon?: string | null
  rules: PerspectiveRules
  groupBy: PerspectiveGroupBy
  sortBy: PerspectiveSortBy
  showCompleted?: boolean
  showDropped?: boolean
}

export type PerspectiveSection<T> = {
  key: string
  title: string
  items: T[]
}

type Task = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged?: boolean
  project_id?: string | null
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
  repeat_rule?: string | null
  created_at?: string | null
}

type Project = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
}

export const defaultPerspectiveDefinitions: Record<string, PerspectiveDefinition> = {
  flagged: {
    id: 'flagged',
    name: 'Flagged',
    description: 'Tasks you marked as important',
    rules: { flagged: true },
    groupBy: 'project',
    sortBy: 'manual',
  },
  available: {
    id: 'available',
    name: 'Available',
    description: 'Tasks you can work on right now',
    rules: { available: true },
    groupBy: 'project',
    sortBy: 'manual',
  },
  'no-project': {
    id: 'no-project',
    name: 'No Project',
    description: 'Tasks that are not assigned to a project',
    rules: { noProject: true },
    groupBy: 'status',
    sortBy: 'manual',
  },
  deferred: {
    id: 'deferred',
    name: 'Deferred',
    description: 'Tasks hidden until later',
    rules: { deferred: true },
    groupBy: 'defer',
    sortBy: 'defer',
  },
  completed: {
    id: 'completed',
    name: 'Completed',
    description: 'Recently finished work',
    rules: { statuses: ['completed'] },
    groupBy: 'project',
    sortBy: 'created',
    showCompleted: true,
  },
  dropped: {
    id: 'dropped',
    name: 'Dropped',
    description: 'Tasks you decided not to do',
    rules: { statuses: ['dropped'] },
    groupBy: 'project',
    sortBy: 'created',
    showDropped: true,
  },
}

function dateBucket(value: string | null | undefined) {
  if (!value) return 'No Date'
  return format(startOfDay(new Date(value)), 'MMM d, yyyy')
}

function sortTasks(tasks: Task[], sortBy: PerspectiveSortBy) {
  const sorted = [...tasks]
  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'due':
      return sorted.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    case 'planned':
      return sorted.sort((a, b) => (a.planned_date ?? '9999').localeCompare(b.planned_date ?? '9999'))
    case 'defer':
      return sorted.sort((a, b) => (a.defer_date ?? '9999').localeCompare(b.defer_date ?? '9999'))
    case 'created':
      return sorted.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    case 'manual':
    default:
      return sorted.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  }
}

export function filterTasksForPerspective({
  tasks,
  projects,
  definition,
}: {
  tasks: Task[]
  projects: Project[]
  taskTagsMap: Record<string, string[]>
  definition: PerspectiveDefinition
}) {
  const projectsMap = projects.reduce<Record<string, Project>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  return tasks.filter((task) => {
    if (!definition.showCompleted && task.status === 'completed') return false
    if (!definition.showDropped && task.status === 'dropped') return false

    if (definition.rules.statuses && !definition.rules.statuses.includes(task.status)) return false
    if (definition.rules.flagged && !task.flagged) return false
    if (definition.rules.noProject && task.project_id) return false
    if (definition.rules.deferred && (!task.defer_date || new Date(task.defer_date) <= new Date())) return false
    if (definition.rules.available && !isTaskAvailable(task as any, projectsMap as any, tasks as any)) return false
    if (definition.rules.hasRepeat && !task.repeat_rule) return false

    return true
  })
}

export function groupTasksForPerspective({
  tasks,
  projects,
  taskTagsMap,
  definition,
}: {
  tasks: Task[]
  projects: Project[]
  taskTagsMap: Record<string, string[]>
  definition: PerspectiveDefinition
}): PerspectiveSection<Task>[] {
  const filtered = sortTasks(
    filterTasksForPerspective({ tasks, projects, taskTagsMap, definition }),
    definition.sortBy
  )

  if (definition.groupBy === 'none') {
    return [{ key: 'all', title: definition.name, items: filtered }]
  }

  const projectsMap = projects.reduce<Record<string, Project>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  const buckets = filtered.reduce<Record<string, Task[]>>((acc, task) => {
    let key = 'Other'
    if (definition.groupBy === 'project') key = task.project_id ? projectsMap[task.project_id]?.name ?? 'Unknown Project' : 'No Project'
    if (definition.groupBy === 'status') key = task.status
    if (definition.groupBy === 'tag') key = taskTagsMap[task.id]?.[0] ?? 'No Tags'
    if (definition.groupBy === 'due') key = dateBucket(task.due_date)
    if (definition.groupBy === 'planned') key = dateBucket(task.planned_date)
    if (definition.groupBy === 'defer') key = dateBucket(task.defer_date)
    acc[key] ??= []
    acc[key].push(task)
    return acc
  }, {})

  return Object.entries(buckets).map(([key, items]) => ({ key, title: key, items }))
}
