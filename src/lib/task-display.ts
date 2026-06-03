import { format } from 'date-fns'
import { repeatRuleLabel } from './recurrence'

export function taskScheduleLabel(task: {
  due_date?: string | null
  planned_date?: string | null
  defer_date?: string | null
}) {
  if (task.due_date) return `Due ${format(new Date(task.due_date), 'MMM d')}`
  if (task.planned_date) return `Planned ${format(new Date(task.planned_date), 'MMM d')}`
  if (task.defer_date) return `Starts ${format(new Date(task.defer_date), 'MMM d')}`
  return undefined
}

export function taskRepeatLabel(task: { repeat_rule?: string | null }) {
  return repeatRuleLabel(task.repeat_rule)
}
