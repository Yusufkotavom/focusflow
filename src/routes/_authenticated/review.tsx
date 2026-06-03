import { createFileRoute } from '@tanstack/react-router'
import { Review } from '@/features/review'

export const Route = createFileRoute('/_authenticated/review')({
  component: Review,
})
