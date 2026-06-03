import { createFileRoute } from '@tanstack/react-router'
import { DroppedPerspective } from '@/features/perspectives'

export const Route = createFileRoute('/_authenticated/dropped')({
  component: DroppedPerspective,
})
