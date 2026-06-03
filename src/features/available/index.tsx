import { ListTodo } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export function Available() {
  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Available</h1>
          <p className='text-xs text-muted-foreground'>Tasks you can work on right now</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <ListTodo className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No available tasks</p>
          <p className='text-xs text-muted-foreground mt-1'>Tasks that are active, not deferred, and not blocked will appear here.</p>
        </div>
      </Main>
    </>
  )
}
