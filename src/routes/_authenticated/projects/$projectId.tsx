import { createFileRoute, notFound } from '@tanstack/react-router'
import { ProjectDetail } from '@/features/projects-view/components/project-detail'
import { useTasksData } from '@/hooks/use-tasks-data'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectRoute,
})

function ProjectRoute() {
  const { projectId } = Route.useParams()
  const { projects } = useTasksData()

  const project = projects.find((p: any) => p.id === projectId)
  if (!project) throw notFound()

  return <ProjectDetail project={project} />
}
