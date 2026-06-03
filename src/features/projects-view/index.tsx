import { FolderOpen } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export function ProjectsView() {
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
      <Main>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <FolderOpen className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No projects yet</p>
          <p className='text-xs text-muted-foreground mt-1'>Create a project to group related tasks.</p>
        </div>
      </Main>
    </>
  )
}
