import { SlidersHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { PerspectiveGroupBy, PerspectiveRules } from '@/lib/perspective-engine'

export function PerspectiveActionsMenu({
  groupBy,
  setGroupBy,
  showCompleted,
  setShowCompleted,
  showDropped,
  setShowDropped,
  rules,
  setRules,
}: {
  groupBy: PerspectiveGroupBy
  setGroupBy: (value: PerspectiveGroupBy) => void
  showCompleted: boolean
  setShowCompleted: (value: boolean) => void
  showDropped: boolean
  setShowDropped: (value: boolean) => void
  rules: PerspectiveRules
  setRules: (value: PerspectiveRules) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <SlidersHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>View Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className='text-xs text-muted-foreground'>Grouping</DropdownMenuLabel>
        {(['none', 'project', 'status', 'tag', 'due', 'planned', 'defer'] as const).map((value) => (
          <DropdownMenuCheckboxItem key={value} checked={groupBy === value} onCheckedChange={() => setGroupBy(value)}>
            Group by {value}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className='text-xs text-muted-foreground'>Quick filters</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={!!rules.flagged} onCheckedChange={(value) => setRules({ ...rules, flagged: !!value })}>
          Flagged only
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!rules.available} onCheckedChange={(value) => setRules({ ...rules, available: !!value })}>
          Available only
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!rules.noProject} onCheckedChange={(value) => setRules({ ...rules, noProject: !!value })}>
          No project only
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!rules.deferred} onCheckedChange={(value) => setRules({ ...rules, deferred: !!value })}>
          Deferred only
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!!rules.hasRepeat} onCheckedChange={(value) => setRules({ ...rules, hasRepeat: !!value })}>
          Recurring only
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showCompleted} onCheckedChange={(value) => setShowCompleted(!!value)}>
          Show completed
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showDropped} onCheckedChange={(value) => setShowDropped(!!value)}>
          Show dropped
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
