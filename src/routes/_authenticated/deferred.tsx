import { createFileRoute } from '@tanstack/react-router'
import { DeferredPerspective } from '@/features/perspectives'

export const Route = createFileRoute('/_authenticated/deferred')({
  component: DeferredPerspective,
})
