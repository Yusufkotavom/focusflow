import { useState } from 'react'
import { FolderOpen, Plus, Folder, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupabase } from '@/hooks/use-supabase'
import { useTasksData } from '@/hooks/use-tasks-data'
import { isTaskAvailable } from '@/features/tasks/utils/availability'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function ProjectsView() {
  const [newProjectName, setNewProjectName] = useState('')
  const [newTaskByProject, setNewTaskByProject] = useState<Record<string, string>>({})
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { projects, tasks, isLoading } = useTasksData()

  const projectsMap = projects.reduce((acc: Record<string, any>, project: any) => {
    acc[project.id] = project
    return acc
  }, {})

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim() || !userId) return

    // Optimistic UI
    const tempId = crypto.randomUUID()
    const tempProject = {
      id: tempId,
      name: newProjectName,
      status: 'active',
      type: 'parallel',
      user_id: userId,
    }
    queryClient.setQueryData(['projects', userId], (old: any) => [tempProject, ...(old || [])])
    setNewProjectName('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').insert([{
        id: tempId,
        name: tempProject.name,
        user_id: userId,
      }])

      if (error) throw error
    } catch (err: any) {
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

  async function createTaskInProject(project: any) {
    const title = (newTaskByProject[project.id] ?? '').trim()
    if (!title || !userId) return

    const projectTasks = getProjectTasks(project.id)
    const nextOrder = projectTasks.length === 0 ? 0 : Math.max(...projectTasks.map((task: any) => task.order ?? 0)) + 1
    const tempId = crypto.randomUUID()
    const tempTask = {
      id: tempId,
      title,
      status: 'active',
      flagged: false,
      blocked: false,
      user_id: userId,
      project_id: project.id,
      order: nextOrder,
      created_at: new Date().toISOString(),
    }

    queryClient.setQueryData(['tasks', userId], (old: any) => [...(old || []), tempTask])
    setNewTaskByProject((prev) => ({ ...prev, [project.id]: '' }))

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').insert([tempTask])
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to create task in project')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Projects</h1>
          <p className='text-xs text-muted-foreground'>Organize actions into outcomes</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main className='p-0 flex flex-col h-[calc(100vh-4rem)]'>
        <form onSubmit={handleCreateProject} className='flex items-center gap-2 px-4 py-3 border-b bg-muted/30'>
          <Plus className='h-4 w-4 text-muted-foreground flex-shrink-0' />
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder='New Project... (press Enter)'
            className='border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm'
            autoFocus
          />
        </form>

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground text-center mt-10'>Loading...</p>
          ) : projects.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <FolderOpen className='h-12 w-12 text-muted-foreground/30 mb-3' />
              <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
              <p className='text-xs text-muted-foreground mt-1'>Create a project to group related tasks.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {projects.map((p: any) => {
                const projectTasks = getProjectTasks(p.id)
                const nextActions = projectTasks.filter((task: any) => isTaskAvailable(task, projectsMap, tasks as any[]))

                return (
                <div key={p.id} className='border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors flex flex-col gap-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Folder className='h-4 w-4 text-blue-500' />
                    <h3 className='font-medium text-sm truncate'>{p.name}</h3>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='outline'>{projectTasks.length} tasks</Badge>
                    <Badge variant={nextActions.length > 0 ? 'default' : 'secondary'}>
                      {nextActions.length} next action{nextActions.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Status</p>
                      <Select value={p.status} onValueChange={(value) => updateProject(p.id, { status: value })}>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='on_hold'>On Hold</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                          <SelectItem value='dropped'>Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Type</p>
                      <Select value={p.type} onValueChange={(value) => updateProject(p.id, { type: value })}>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='parallel'>Parallel</SelectItem>
                          <SelectItem value='sequential'>Sequential</SelectItem>
                          <SelectItem value='single'>Single Action List</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='space-y-2 border-t pt-4'>
                    <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2'>
                      <Plus className='h-4 w-4 text-muted-foreground' />
                      <Input
                        value={newTaskByProject[p.id] ?? ''}
                        onChange={(e) => setNewTaskByProject((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            createTaskInProject(p)
                          }
                        }}
                        placeholder='Add task to project...'
                        className='border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
                      />
                    </div>

                    <div className='flex gap-3 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1 capitalize'>
                        <CheckCircle className='h-3 w-3' /> {p.status}
                      </span>
                      <span className='flex items-center gap-1 capitalize'>
                        <Clock className='h-3 w-3' /> {p.type}
                      </span>
                    </div>

                    {projectTasks.slice(0, 5).map((task: any, index: number) => (
                      <div key={task.id} className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <ArrowRight className='h-3 w-3' />
                        <span className='truncate'>
                          {p.type === 'sequential' ? `${index + 1}. ` : ''}
                          {task.title}
                        </span>
                        {nextActions.some((next: any) => next.id === task.id) ? <Badge variant='outline'>Next</Badge> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
