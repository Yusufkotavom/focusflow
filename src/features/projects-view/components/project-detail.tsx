import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskCollectionView } from '@/components/task-collection-view'
import { useSupabase } from '@/hooks/use-supabase'
import { useTasksData } from '@/hooks/use-tasks-data'

type ProjectTask = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  project_id?: string | null
  order?: number | null
  user_id?: string
  flagged?: boolean
  created_at?: string
}

type ProjectRecord = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
}

function ProjectQuickAdd({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className='flex items-center gap-2 border-b bg-muted/30 px-4 py-3'
    >
      <Plus className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Add task... (press Enter)'
        className='border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
        autoFocus
      />
    </form>
  )
}

export function ProjectDetail({ project }: { project: ProjectRecord }) {
  const navigate = useNavigate()
  const getSupabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { tasks, projects } = useTasksData()
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const projectTasks = useMemo(
    () => (tasks as ProjectTask[]).filter((task) => task.project_id === project.id),
    [tasks, project.id]
  )
  const activeTasks = projectTasks.filter((task) => task.status !== 'completed' && task.status !== 'dropped')
  const completedCount = projectTasks.filter((task) => task.status === 'completed').length

  async function updateProject(updates: Record<string, unknown>) {
    queryClient.setQueryData(['projects', userId], (old: ProjectRecord[] | undefined) =>
      old?.map((item) => (item.id === project.id ? { ...item, ...updates } : item))
    )
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').update(updates).eq('id', project.id)
      if (error) throw error
    } catch (_err) {
      toast.error('Failed to update project')
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    }
  }

  async function deleteProject() {
    queryClient.setQueryData(['projects', userId], (old: ProjectRecord[] | undefined) =>
      old?.filter((item) => item.id !== project.id)
    )
    navigate({ to: '/projects' })
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
    } catch (_err) {
      toast.error('Failed to delete project')
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    }
  }

  async function addTask() {
    if (!newTaskTitle.trim() || !userId) return
    const tempId = crypto.randomUUID()
    const nextOrder = projectTasks.length === 0 ? 0 : Math.max(...projectTasks.map((task) => task.order ?? 0)) + 1
    const tempTask = {
      id: tempId,
      title: newTaskTitle.trim(),
      status: 'active' as const,
      flagged: false,
      user_id: userId,
      project_id: project.id,
      parent_task_id: null,
      order: nextOrder,
      created_at: new Date().toISOString(),
    }

    queryClient.setQueryData(['tasks', userId], (old: ProjectTask[] | undefined) => [...(old ?? []), tempTask])
    setNewTaskTitle('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').insert([tempTask])
      if (error) throw error
    } catch (_err) {
      toast.error('Failed to create task')
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }
  }

  return (
    <TaskCollectionView
      perspective={{
        id: project.id,
        name: project.name,
        description: `${activeTasks.length} active · ${completedCount} completed`,
        rules: { projectIds: [project.id] },
        groupBy: 'none',
        sortBy: 'manual',
        showCompleted: false,
        showDropped: false,
      }}
      tasks={tasks as ProjectTask[]}
      projects={projects as ProjectRecord[]}
      topContent={
        <ProjectQuickAdd
          value={newTaskTitle}
          onChange={setNewTaskTitle}
          onSubmit={addTask}
        />
      }
      headerLeading={
        <Button variant='ghost' size='icon' onClick={() => navigate({ to: '/projects' })}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
      }
      headerTrailing={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='icon'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {(['active', 'on_hold', 'completed', 'dropped'] as const).map((status) => (
              <DropdownMenuItem key={status} onClick={() => updateProject({ status })}>
                <span className='capitalize'>{status.replace('_', ' ')}</span>
                {project.status === status ? <span className='ml-auto text-primary'>●</span> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            {(['parallel', 'sequential', 'single'] as const).map((type) => (
              <DropdownMenuItem key={type} onClick={() => updateProject({ type })}>
                <span className='capitalize'>{type}</span>
                {project.type === type ? <span className='ml-auto text-primary'>●</span> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive' onClick={() => deleteProject()}>
              <Trash2 className='mr-2 h-4 w-4' /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      empty={
        <div className='flex h-40 flex-col items-center justify-center text-center text-muted-foreground'>
          <p className='text-sm font-medium'>No tasks in this project</p>
          <p className='mt-1 text-xs'>Add a task above to get started.</p>
        </div>
      }
    />
  )
}
