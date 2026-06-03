import { createFileRoute } from '@tanstack/react-router'
import { CompletedPerspective } from '@/features/perspectives'

export const Route = createFileRoute('/_authenticated/completed')({
  component: CompletedPerspective,
})
