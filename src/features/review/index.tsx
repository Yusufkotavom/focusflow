import { Activity, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { isBefore, startOfDay, addDays, format } from 'date-fns'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTasksData } from '@/hooks/use-tasks-data'
import { useSupabase } from '@/hooks/use-supabase'
import { toast } from 'sonner'

export function Review() {
  const { projects, tasks, isLoading } = useTasksData()
  const { userId } = useAuth()
  const getSupabase = useSupabase()
  const queryClient = useQueryClient()

  const today = startOfDay(new Date())
  const reviewProjects = projects.filter((project: any) => {
    if (project.status !== 'active') return false
    if (!project.next_review_at) return true
    return !isBefore(today, startOfDay(new Date(project.next_review_at)))
  })

  async function markReviewed(project: any) {
    const nextReviewAt = addDays(new Date(), project.review_interval_days ?? 7).toISOString()
    const payload = {
      last_reviewed_at: new Date().toISOString(),
      next_review_at: nextReviewAt,
    }

    queryClient.setQueryData(['projects', userId], (old: any) =>
      old?.map((item: any) => (item.id === project.id ? { ...item, ...payload } : item))
    )

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').update(payload).eq('id', project.id)
      if (error) throw error
    } catch (err) {
      console.error(err)
      toast.error('Failed to mark project reviewed')
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    }
  }

  function projectTasks(projectId: string) {
    return tasks.filter((task: any) => task.project_id === projectId && task.status !== 'dropped')
  }

  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Review</h1>
          <p className='text-xs text-muted-foreground'>Keep your projects relevant</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='p-4'>
        {isLoading ? (
          <p className='text-sm text-muted-foreground text-center mt-10'>Loading review queue...</p>
        ) : reviewProjects.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <Activity className='h-12 w-12 text-muted-foreground/30 mb-3' />
            <p className='text-sm font-medium text-muted-foreground'>No projects due for review</p>
            <p className='text-xs text-muted-foreground mt-1'>Projects with review intervals will appear here when they need attention.</p>
          </div>
        ) : (
          <div className='grid gap-4'>
            {reviewProjects.map((project: any) => {
              const items = projectTasks(project.id)
              const activeCount = items.filter((task: any) => task.status === 'active').length
              const inboxCount = items.filter((task: any) => task.status === 'inbox').length

              return (
                <div key={project.id} className='rounded-lg border bg-card p-4'>
                  <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                    <div>
                      <h3 className='text-sm font-semibold'>{project.name}</h3>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Review every {project.review_interval_days ?? 7} day(s)
                        {project.next_review_at ? ` · Due ${format(new Date(project.next_review_at), 'MMM d, yyyy')}` : ' · Never reviewed'}
                      </p>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{items.length} tasks</Badge>
                      <Badge variant='secondary'>{activeCount} active</Badge>
                      {inboxCount > 0 ? <Badge>{inboxCount} inbox</Badge> : null}
                      <Button size='sm' onClick={() => markReviewed(project)}>
                        <CheckCircle2 className='mr-2 h-4 w-4' />
                        Mark Reviewed
                      </Button>
                    </div>
                  </div>

                  <div className='mt-4 grid gap-2'>
                    {items.slice(0, 5).map((task: any) => (
                      <div key={task.id} className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <ArrowRight className='h-3 w-3' />
                        <span className='truncate'>{task.title}</span>
                        <span className='ml-auto inline-flex items-center gap-1 capitalize'>
                          <Clock className='h-3 w-3' />
                          {task.status}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 ? <p className='text-xs text-muted-foreground'>No tasks in this project yet.</p> : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Main>
    </>
  )
}
