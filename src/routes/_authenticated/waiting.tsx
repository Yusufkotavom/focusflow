import { createFileRoute } from '@tanstack/react-router'
import { WaitingPerspective } from '@/features/perspectives'

export const Route = createFileRoute('/_authenticated/waiting')({
  component: WaitingPerspective,
})
