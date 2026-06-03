import { createFileRoute, notFound } from '@tanstack/react-router'
import { CustomPerspectiveView } from '@/features/perspectives'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'
import type { PerspectiveDefinition, PerspectiveGroupBy, PerspectiveRules, PerspectiveSortBy } from '@/lib/perspective-engine'

type PerspectiveRow = {
  id: string
  name: string
  description?: string | null
  rules?: PerspectiveRules | null
  group_by?: PerspectiveGroupBy | null
  sort_by?: PerspectiveSortBy | null
  show_completed?: boolean | null
  show_dropped?: boolean | null
}

export const Route = createFileRoute('/_authenticated/perspectives/$perspectiveId')({
  component: PerspectiveRoute,
})

function PerspectiveRoute() {
  const { perspectiveId } = Route.useParams()
  const { perspectives, isLoading } = usePerspectivesData()

  if (isLoading) return null

  const perspective = (perspectives as PerspectiveRow[]).find((item) => item.id === perspectiveId)
  if (!perspective) throw notFound()

  const definition: PerspectiveDefinition = {
    id: perspective.id,
    name: perspective.name,
    description: perspective.description ?? `Custom perspective · group by ${perspective.group_by ?? 'none'}`,
    rules: perspective.rules ?? {},
    groupBy: perspective.group_by ?? 'none',
    sortBy: perspective.sort_by ?? 'manual',
    showCompleted: perspective.show_completed ?? false,
    showDropped: perspective.show_dropped ?? false,
  }

  return (
    <CustomPerspectiveView perspective={definition} />
  )
}
