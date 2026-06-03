import { CalendarDays } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export function Forecast() {
  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Forecast</h1>
          <p className='text-xs text-muted-foreground'>Your schedule at a glance</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <CalendarDays className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No items scheduled</p>
          <p className='text-xs text-muted-foreground mt-1'>Assign defer, planned, or due dates to see them here.</p>
        </div>
      </Main>
    </>
  )
}
