import { createFileRoute } from '@tanstack/react-router'
import { ProjectsView } from '@/features/projects-view'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: ProjectsView,
})
