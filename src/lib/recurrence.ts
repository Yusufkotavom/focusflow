import { addDays, addMonths, addWeeks, addYears } from 'date-fns'

export type RepeatRule = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function isRepeatRule(value: string | null | undefined): value is RepeatRule {
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly'
}

export function repeatRuleLabel(value: string | null | undefined) {
  if (!isRepeatRule(value)) return null
  return value[0].toUpperCase() + value.slice(1)
}

export function shiftRecurringDate(date: string | null | undefined, repeatRule: RepeatRule) {
  if (!date) return null

  const base = new Date(date)
  switch (repeatRule) {
    case 'daily':
      return addDays(base, 1).toISOString()
    case 'weekly':
      return addWeeks(base, 1).toISOString()
    case 'monthly':
      return addMonths(base, 1).toISOString()
    case 'yearly':
      return addYears(base, 1).toISOString()
  }
}
