import { createFileRoute, notFound } from '@tanstack/react-router'
import { CustomPerspectiveView } from '@/features/perspectives'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'

export const Route = createFileRoute('/_authenticated/perspectives/$perspectiveId')({
  component: PerspectiveRoute,
})

function PerspectiveRoute() {
  const { perspectiveId } = Route.useParams()
  const { perspectives, isLoading } = usePerspectivesData()

  if (isLoading) return null

  const perspective = perspectives.find((item: any) => item.id === perspectiveId)
  if (!perspective) throw notFound()

  return (
    <CustomPerspectiveView
      perspective={{
        id: perspective.id,
        name: perspective.name,
        description: `Custom perspective · group by ${perspective.group_by ?? 'none'}`,
        rules: perspective.rules ?? {},
        groupBy: perspective.group_by ?? 'none',
        sortBy: perspective.sort_by ?? 'manual',
        showCompleted: perspective.show_completed ?? false,
        showDropped: perspective.show_dropped ?? false,
      }}
    />
  )
}
