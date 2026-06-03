import { format, startOfDay } from 'date-fns'
import { isTaskAvailable, isTaskVisibleForProjectType } from '@/features/tasks/utils/availability'

export type PerspectiveGroupBy = 'none' | 'project' | 'status' | 'tag' | 'due' | 'planned' | 'defer'
export type PerspectiveSortBy = 'manual' | 'title' | 'created' | 'due' | 'planned' | 'defer'

export type PerspectiveRules = {
  mode?: 'and' | 'or'
  flagged?: boolean
  noProject?: boolean
  deferred?: boolean
  available?: boolean
  statuses?: string[]
  hasRepeat?: boolean
  projectIds?: string[]
  tagIds?: string[]
  dateFields?: ('due' | 'planned' | 'defer')[]
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
  parent_task_id?: string | null
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
  repeat_rule?: string | null
  created_at?: string | null
  order?: number | null
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
      return sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
}

export function filterTasksForPerspective({
  tasks,
  projects,
  taskTagIdsMap,
  definition,
}: {
  tasks: Task[]
  projects: Project[]
  taskTagIdsMap: Record<string, string[]>
  definition: PerspectiveDefinition
}) {
  const projectsMap = projects.reduce<Record<string, Project>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  return tasks.filter((task) => {
    if (!definition.showCompleted && task.status === 'completed') return false
    if (!definition.showDropped && task.status === 'dropped') return false
    if (
      (task.status === 'active' || task.status === 'inbox') &&
      !isTaskVisibleForProjectType(task, projectsMap, tasks)
    ) {
      return false
    }

    const checks: boolean[] = []
    const rules = definition.rules ?? {}

    if (rules.statuses?.length) checks.push(rules.statuses.includes(task.status))
    if (rules.flagged) checks.push(!!task.flagged)
    if (rules.noProject) checks.push(!task.project_id)
    if (rules.deferred) checks.push(!!task.defer_date && new Date(task.defer_date) > new Date())
    if (rules.available) checks.push(isTaskAvailable(task, projectsMap, tasks))
    if (rules.hasRepeat) checks.push(!!task.repeat_rule)
    if (rules.projectIds?.length) checks.push(!!task.project_id && rules.projectIds.includes(task.project_id))
    if (rules.tagIds?.length) {
      const taskTagIds = taskTagIdsMap[task.id] ?? []
      checks.push(rules.tagIds.some((tagId) => taskTagIds.includes(tagId)))
    }
    if (rules.dateFields?.length) {
      checks.push(
        rules.dateFields.some((field) => {
          if (field === 'due') return !!task.due_date
          if (field === 'planned') return !!task.planned_date
          if (field === 'defer') return !!task.defer_date
          return false
        })
      )
    }

    if (checks.length === 0) return true
    return (rules.mode ?? 'and') === 'or' ? checks.some(Boolean) : checks.every(Boolean)
  })
}

export function groupTasksForPerspective({
  tasks,
  projects,
  taskTagsMap,
  taskTagIdsMap,
  definition,
}: {
  tasks: Task[]
  projects: Project[]
  taskTagsMap: Record<string, string[]>
  taskTagIdsMap: Record<string, string[]>
  definition: PerspectiveDefinition
}): PerspectiveSection<Task>[] {
  const filtered = sortTasks(
    filterTasksForPerspective({ tasks, projects, taskTagIdsMap, definition }),
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
