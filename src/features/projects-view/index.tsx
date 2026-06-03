import { useState } from 'react'
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
import { useAppStore } from '@/stores/app-store'
import { ProjectDetail } from './components/project-detail'
import { ProjectListRow } from '@/components/project-list-row'
import { useState as useReactState } from 'react'

export function ProjectsView() {
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { projects, tasks, isLoading } = useTasksData()
  const { selectedTaskId, setSelectedTask } = useAppStore()
  const [showCompleted, setShowCompleted] = useReactState(false)
  const [showDropped, setShowDropped] = useReactState(false)
  const [groupBy, setGroupBy] = useReactState<'none' | 'project' | 'status' | 'tag' | 'due' | 'planned' | 'defer'>('none')
  const [rules, setRules] = useReactState({})

  const projectsMap = projects.reduce((acc: Record<string, any>, project: any) => {
    acc[project.id] = project
    return acc
  }, {})

  const selectedProject = selectedProjectId
    ? projects.find((project: any) => project.id === selectedProjectId) ?? null
    : null

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
    setSelectedProjectId(tempId)

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

  async function updateProject(id: string, updates: Record<string, unknown>) {
    queryClient.setQueryData(['projects', userId], (old: any) =>
      old?.map((project: any) => (project.id === id ? { ...project, ...updates } : project))
    )

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').update(updates).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to update project')
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    }
  }

  function getProjectTasks(projectId: string) {
    return tasks
      .filter((task: any) => task.project_id === projectId && task.status !== 'dropped')
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Projects</h1>
          <p className='text-xs text-muted-foreground'>Organize actions into outcomes</p>
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

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <p className='mt-10 text-center text-sm text-muted-foreground'>Loading...</p>
          ) : projects.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center text-center'>
              <FolderOpen className='mb-3 h-12 w-12 text-muted-foreground/30' />
              <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
              <p className='mt-1 text-xs text-muted-foreground'>Create a project to group related tasks.</p>
            </div>
          ) : (
            <div className='grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]'>
              <div className='overflow-hidden rounded-lg border bg-card'>
                {projects.map((project: any) => {
                  const projectTasks = getProjectTasks(project.id)
                  const nextActions = projectTasks.filter((task: any) => isTaskAvailable(task, projectsMap, tasks as any[]))
                  const firstNextAction = nextActions[0]?.title

                  return (
                    <ProjectListRow
                      key={project.id}
                      project={project}
                      isSelected={selectedProjectId === project.id}
                      onSelect={() => setSelectedProjectId(project.id)}
                      subtitle={firstNextAction ? `Next: ${firstNextAction}` : 'No next action yet'}
                      meta={`${projectTasks.length} tasks · ${project.status} · ${project.type}`}
                    />
                  )
                })}
              </div>

              {selectedProject ? (
                <ProjectDetail
                  project={selectedProject}
                  tasks={getProjectTasks(selectedProject.id)}
                  projectsMap={projectsMap}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTask}
                  onUpdateProject={updateProject}
                />
              ) : (
                <div className='flex min-h-[500px] items-center justify-center rounded-lg border bg-card text-center text-muted-foreground'>
                  <div>
                    <FolderOpen className='mx-auto mb-3 h-10 w-10 opacity-30' />
                    <p className='text-sm font-medium'>Select a project</p>
                    <p className='text-xs'>Open project detail to manage tasks, ordering, and subtasks.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
