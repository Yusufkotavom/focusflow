import { useState, useEffect } from 'react'
import { X, Flag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/stores/app-store'
import { useSupabase } from '@/hooks/use-supabase'
import { toast } from 'sonner'

type Task = {
  id: string
  title: string
  note?: string
  status: 'inbox' | 'active' | 'completed' | 'dropped'
  flagged: boolean
  defer_date?: string
  planned_date?: string
  due_date?: string
  project_id?: string
}

function InspectorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>{label}</label>
      {children}
    </div>
  )
}

function DateField({ label, value, placeholder }: { label: string; value?: string; placeholder: string }) {
  return (
    <InspectorField label={label}>
      <button className='w-full flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent transition-colors text-left'>
        <Calendar className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ?? placeholder}
        </span>
      </button>
    </InspectorField>
  )
}

export function TaskInspectorPanel() {
  const { isInspectorOpen, selectedTaskId, setSelectedTask } = useAppStore()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const getSupabase = useSupabase()

  useEffect(() => {
    let channel: any

    async function setupTask() {
      if (!selectedTaskId) {
        setTask(null)
        return
      }

      setLoading(true)
      try {
        const supabase = await getSupabase()
        
        // Initial fetch
        const { data, error } = await supabase.from('tasks').select('*').eq('id', selectedTaskId).single()
        if (error) throw error
        setTask(data)

        // Realtime updates for THIS specific task
        channel = supabase
          .channel(`task-${selectedTaskId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `id=eq.${selectedTaskId}` }, (payload) => {
            setTask(payload.new as Task)
          })
          .subscribe()

      } catch (err) {
        console.error(err)
        toast.error('Failed to load task details')
        setSelectedTask(null)
      } finally {
        setLoading(false)
      }
    }

    setupTask()

    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [selectedTaskId, getSupabase, setSelectedTask])

  async function updateTask(updates: Partial<Task>) {
    if (!task) return
    setTask({ ...task, ...updates } as Task) // Optimistic
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
      if (error) throw error
    } catch (err) {
      toast.error('Failed to save changes')
    }
  }

  if (!isInspectorOpen) return null

  return (
    <div className='w-72 border-l bg-background h-svh flex flex-col flex-shrink-0'>
      <div className='h-14 border-b flex items-center justify-between px-3 flex-shrink-0'>
        <span className='text-sm font-medium'>Inspector</span>
        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setSelectedTask(null)}>
          <X className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {!task || loading ? (
           <p className='text-sm text-muted-foreground'>Loading details...</p>
        ) : (
          <>
            <InspectorField label='Title'>
              <Input 
                value={task.title} 
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                onBlur={(e) => updateTask({ title: e.target.value })}
                className='text-sm' 
              />
            </InspectorField>

            <InspectorField label='Note'>
              <Textarea 
                value={task.note || ''}
                onChange={(e) => setTask({ ...task, note: e.target.value })}
                onBlur={(e) => updateTask({ note: e.target.value })}
                placeholder='Add a note...' 
                className='text-sm min-h-20 resize-none' 
              />
            </InspectorField>

            <Separator />

            <InspectorField label='Status'>
              <div className='flex gap-2 flex-wrap'>
                {(['inbox', 'active', 'completed', 'dropped'] as const).map((s) => (
                  <Badge
                    key={s}
                    variant={task.status === s ? 'default' : 'outline'}
                    className='cursor-pointer capitalize text-xs'
                    onClick={() => updateTask({ status: s })}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </InspectorField>

            <InspectorField label='Flag'>
              <button 
                onClick={() => updateTask({ flagged: !task.flagged })}
                className='flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent transition-colors w-full text-left'
              >
                <Flag className={`h-3.5 w-3.5 ${task.flagged ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className={task.flagged ? 'text-orange-500' : 'text-muted-foreground'}>
                  {task.flagged ? 'Flagged' : 'Not Flagged'}
                </span>
              </button>
            </InspectorField>
            
            <Separator />

            <DateField label='Defer Date' placeholder='Not set — always available' value={task.defer_date} />
            <DateField label='Planned Date' placeholder='Not scheduled' value={task.planned_date} />
            <DateField label='Due Date' placeholder='No deadline' value={task.due_date} />

          </>
        )}
      </div>
    </div>
  )
}
