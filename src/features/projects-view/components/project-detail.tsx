import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProjectTaskList } from './project-task-list'

export function ProjectDetail({
  project,
  tasks,
  projectsMap,
  selectedTaskId,
  onSelectTask,
  onUpdateProject,
}: {
  project: any
  tasks: any[]
  projectsMap: Record<string, any>
  selectedTaskId: string | null
  onSelectTask: (taskId: string | null) => void
  onUpdateProject: (id: string, updates: Record<string, unknown>) => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')

  return (
    <div className='flex min-h-[500px] flex-col rounded-lg border bg-card'>
      <div className='border-b p-4'>
        <div className='flex items-center gap-2'>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== project.name) onUpdateProject(project.id, { name: name.trim() })
            }}
            className='h-9 border-0 px-0 text-base font-semibold shadow-none focus-visible:ring-0'
          />
          <Badge variant='outline' className='capitalize'>{project.status}</Badge>
          <Badge variant='secondary' className='capitalize'>{project.type}</Badge>
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onUpdateProject(project.id, { description: description.trim() || null })}
          placeholder='Describe the project outcome...'
          className='mt-2 min-h-20 resize-none border-0 px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0'
        />
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto p-4'>
        <ProjectTaskList
          project={project}
          tasks={tasks}
          projectsMap={projectsMap}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  )
}
