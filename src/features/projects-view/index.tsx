import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FolderOpen, Plus } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useSupabase } from '@/hooks/use-supabase'
import { useTasksData } from '@/hooks/use-tasks-data'
import { isTaskAvailable } from '@/features/tasks/utils/availability'
import { ProjectListRow } from '@/components/project-list-row'
import type { PerspectiveGroupBy, PerspectiveRules } from '@/lib/perspective-engine'

export function ProjectsView() {
  const [newProjectName, setNewProjectName] = useState('')
  const navigate = useNavigate()
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { projects, tasks, isLoading } = useTasksData()
  const [showCompleted, setShowCompleted] = useState(false)
  const [showDropped, setShowDropped] = useState(false)
  const [groupBy, setGroupBy] = useState<PerspectiveGroupBy>('none')
  const [rules, setRules] = useState<PerspectiveRules>({})

  const projectsMap = projects.reduce((acc: Record<string, any>, project: any) => {
    acc[project.id] = project
    return acc
  }, {})

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim() || !userId) return

    const tempId = crypto.randomUUID()
    const tempProject = {
      id: tempId,
      name: newProjectName.trim(),
      status: 'active',
      type: 'parallel',
      user_id: userId,
    }
    queryClient.setQueryData(['projects', userId], (old: any) => [tempProject, ...(old || [])])
    setNewProjectName('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').insert([tempProject])
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to create project')
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    }
  }

  function getProjectStats(projectId: string) {
    const projectTasks = tasks.filter((t: any) => t.project_id === projectId && t.status !== 'dropped')
    const completedTasks = projectTasks.filter((t: any) => t.status === 'completed')
    const nextActions = projectTasks.filter((t: any) => isTaskAvailable(t, projectsMap, tasks as any[]))
    return {
      taskCount: projectTasks.length,
      completedCount: completedTasks.length,
      nextAction: nextActions[0]?.title,
    }
  }

  const filteredProjects = projects.filter((project: any) => {
    if (rules.statuses?.length && !rules.statuses.includes(project.status)) return false
    return true
  })

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    if (groupBy === 'status') return (a.status ?? '').localeCompare(b.status ?? '')
    return (a.name ?? '').localeCompare(b.name ?? '')
  })

  const projectGroups = groupBy === 'status'
    ? sortedProjects.reduce<Record<string, any[]>>((acc, project: any) => {
        const key = project.status ?? 'other'
        acc[key] ??= []
        acc[key].push(project)
        return acc
      }, {})
    : { all: sortedProjects }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Projects</h1>
          <p className='text-xs text-muted-foreground'>{projects.length} projects</p>
        </div>
        <ThemeSwitch />
        <PerspectiveActionsMenu
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          showDropped={showDropped}
          setShowDropped={setShowDropped}
          rules={rules}
          setRules={setRules}
        />
      </Header>

      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreateProject} className='flex items-center gap-2 border-b bg-muted/30 px-4 py-3'>
          <Plus className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder='New Project... (press Enter)'
            className='border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
          />
        </form>

        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <p className='mt-10 text-center text-sm text-muted-foreground'>Loading...</p>
          ) : projects.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <FolderOpen className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
              <p className='mt-1 text-xs text-muted-foreground'>Create a project to group related tasks.</p>
            </div>
          ) : (
            Object.entries(projectGroups).map(([groupKey, groupProjects]) => (
              <section key={groupKey}>
                {groupBy !== 'none' ? (
                  <div className='sticky top-0 z-10 bg-background/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur'>
                    {groupKey} ({groupProjects.length})
                  </div>
                ) : null}
                {groupProjects.map((project: any) => {
                  const stats = getProjectStats(project.id)
                  return (
                    <ProjectListRow
                      key={project.id}
                      project={project}
                      nextAction={stats.nextAction}
                      taskCount={stats.taskCount}
                      completedCount={stats.completedCount}
                      onSelect={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id } })}
                    />
                  )
                })}
              </section>
            ))
          )}
        </div>
      </Main>
    </>
  )
}
