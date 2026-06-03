import { createFileRoute } from '@tanstack/react-router'
import { Available } from '@/features/available'

export const Route = createFileRoute('/_authenticated/available')({
  component: Available,
})
