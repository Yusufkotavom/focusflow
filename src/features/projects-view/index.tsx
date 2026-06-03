import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FolderOpen, Plus } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { PerspectiveActionsMenu } from '@/components/perspective-actions-menu'
import { useSupabase } from '@/hooks/use-supabase'
import { useTasksData } from '@/hooks/use-tasks-data'
import { isTaskAvailable } from '@/features/tasks/utils/availability'
import { ProjectListRow } from '@/components/project-list-row'
import { SortableProjectRow } from '@/components/sortable-project-row'
import type { PerspectiveGroupBy, PerspectiveRules } from '@/lib/perspective-engine'

type ProjectRecord = {
  id: string
  name: string
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  type: 'parallel' | 'sequential' | 'single'
  user_id: string
  order?: number | null
  created_at?: string | null
}

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
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const projectsMap = projects.reduce<Record<string, ProjectRecord>>((acc, project) => {
    acc[project.id] = project
    return acc
  }, {})

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim() || !userId) return

    const tempId = crypto.randomUUID()
    const tempProject: ProjectRecord = {
      id: tempId,
      name: newProjectName.trim(),
      status: 'active',
      type: 'parallel',
      user_id: userId,
      order: projects.length,
    }
    queryClient.setQueryData<ProjectRecord[]>(['projects', userId, getSupabase], (old) => [
      ...(old ?? []),
      tempProject,
    ])
    setNewProjectName('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').insert([tempProject])
      if (error) throw error
    } catch {
      toast.error('Failed to create project')
      queryClient.invalidateQueries({ queryKey: ['projects', userId, getSupabase] })
    }
  }

  function getProjectStats(projectId: string) {
    const projectTasks = tasks.filter((task) => task.project_id === projectId && task.status !== 'dropped')
    const completedTasks = projectTasks.filter((task) => task.status === 'completed')
    const nextActions = projectTasks.filter((task) => isTaskAvailable(task, projectsMap, tasks))
    return {
      taskCount: projectTasks.length,
      completedCount: completedTasks.length,
      nextAction: nextActions[0]?.title,
    }
  }

  const filteredProjects = projects.filter((project) => {
    if (rules.statuses?.length && !rules.statuses.includes(project.status)) return false
    return true
  })

  const sortedProjects = useMemo(() => {
    const ordered = [...filteredProjects].sort((a, b) => {
      const byOrder = (a.order ?? 0) - (b.order ?? 0)
      if (byOrder !== 0) return byOrder
      return (a.created_at ?? '').localeCompare(b.created_at ?? '')
    })

    if (groupBy === 'status') {
      return ordered.sort((a, b) => {
        const byStatus = (a.status ?? '').localeCompare(b.status ?? '')
        if (byStatus !== 0) return byStatus
        return (a.order ?? 0) - (b.order ?? 0)
      })
    }

    return ordered
  }, [filteredProjects, groupBy])

  const projectGroups = groupBy === 'status'
    ? sortedProjects.reduce<Record<string, ProjectRecord[]>>((acc, project) => {
        const key = project.status ?? 'other'
        acc[key] ??= []
        acc[key].push(project)
        return acc
      }, {})
    : { all: sortedProjects }

  async function handleProjectDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!userId || groupBy !== 'none' || !over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const currentProjects = [...sortedProjects]
    const oldIndex = currentProjects.findIndex((project) => project.id === activeId)
    const newIndex = currentProjects.findIndex((project) => project.id === overId)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

    const reordered = arrayMove(currentProjects, oldIndex, newIndex)
    const orderById = new Map(reordered.map((project, index) => [project.id, index]))

    queryClient.setQueryData<ProjectRecord[]>(['projects', userId, getSupabase], (old) =>
      old?.map((project) => {
        const nextOrder = orderById.get(project.id)
        return nextOrder === undefined ? project : { ...project, order: nextOrder }
      })
    )

    try {
      const supabase = await getSupabase()
      const results = await Promise.all(
        reordered.map((project, index) =>
          supabase.from('projects').update({ order: index }).eq('id', project.id)
        )
      )
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error
    } catch {
      toast.error('Failed to reorder projects')
      queryClient.invalidateQueries({ queryKey: ['projects', userId, getSupabase] })
    }
  }

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
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleProjectDragEnd}
            >
              {Object.entries(projectGroups).map(([groupKey, groupProjects]) => (
                <section key={groupKey}>
                  {groupBy !== 'none' ? (
                    <div className='sticky top-0 z-10 bg-background/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur'>
                      {groupKey} ({groupProjects.length})
                    </div>
                  ) : null}
                  <SortableContext
                    items={groupProjects.map((project) => project.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {groupProjects.map((project) => {
                      const stats = getProjectStats(project.id)
                      const row = (
                        <ProjectListRow
                          key={project.id}
                          project={project}
                          nextAction={stats.nextAction}
                          taskCount={stats.taskCount}
                          completedCount={stats.completedCount}
                          onSelect={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id } })}
                        />
                      )

                      return groupBy === 'none' ? (
                        <SortableProjectRow key={project.id} projectId={project.id}>
                          {row}
                        </SortableProjectRow>
                      ) : (
                        row
                      )
                    })}
                  </SortableContext>
                </section>
              ))}
            </DndContext>
          )}
        </div>
      </Main>
    </>
  )
}
