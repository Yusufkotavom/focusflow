import { Activity } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export function Review() {
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
      <Main>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Activity className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No projects due for review</p>
          <p className='text-xs text-muted-foreground mt-1'>Projects with review intervals will appear here when they need attention.</p>
        </div>
      </Main>
    </>
  )
}
