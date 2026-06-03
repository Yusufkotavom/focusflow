import { createFileRoute } from '@tanstack/react-router'
import { NoProjectPerspective } from '@/features/perspectives'

export const Route = createFileRoute('/_authenticated/no-project')({
  component: NoProjectPerspective,
})
