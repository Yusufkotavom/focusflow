import { createFileRoute } from '@tanstack/react-router'
import { Flagged } from '@/features/flagged'

export const Route = createFileRoute('/_authenticated/flagged')({
  component: Flagged,
})
