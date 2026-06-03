import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Folder, Clock, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

export function ProjectsView() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
  const getSupabase = useSupabase()
  const { userId } = useAuth()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const supabase = await getSupabase()
      // Note: Di production pakai RLS, tapi sekarang kita hard-filter by userId
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

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
    setProjects([tempProject, ...projects])
    setNewProjectName('')

    try {
      const supabase = await getSupabase()
      const { error } = await supabase.from('projects').insert([{
        name: tempProject.name,
        user_id: userId,
      }])

      if (error) throw error
      // Refresh setelah berhasil
      fetchProjects()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to create project')
      // Rollback
      fetchProjects()
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
          {loading ? (
            <p className='text-sm text-muted-foreground text-center mt-10'>Loading...</p>
          ) : projects.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-center'>
              <FolderOpen className='h-12 w-12 text-muted-foreground/30 mb-3' />
              <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
              <p className='text-xs text-muted-foreground mt-1'>Create a project to group related tasks.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {projects.map((p) => (
                <div key={p.id} className='border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors cursor-pointer flex flex-col'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Folder className='h-4 w-4 text-blue-500' />
                    <h3 className='font-medium text-sm truncate'>{p.name}</h3>
                  </div>
                  <div className='flex gap-3 text-xs text-muted-foreground mt-auto pt-4'>
                    <span className='flex items-center gap-1 capitalize'>
                      <CheckCircle className='h-3 w-3' /> {p.status}
                    </span>
                    <span className='flex items-center gap-1 capitalize'>
                      <Clock className='h-3 w-3' /> {p.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
