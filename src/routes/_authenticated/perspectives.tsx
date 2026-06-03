import { createFileRoute } from '@tanstack/react-router'
import { PerspectivesManage } from '@/features/perspectives/manage'

export const Route = createFileRoute('/_authenticated/perspectives')({
  component: PerspectivesManage,
})
