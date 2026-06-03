import { Tags } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export function TagsView() {
  return (
    <>
      <Header>
        <div className='flex-1'>
          <h1 className='text-sm font-semibold'>Tags</h1>
          <p className='text-xs text-muted-foreground'>Context-based organization</p>
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='flex flex-col items-center justify-center h-64 text-center'>
          <Tags className='h-12 w-12 text-muted-foreground/30 mb-3' />
          <p className='text-sm font-medium text-muted-foreground'>No tags created</p>
          <p className='text-xs text-muted-foreground mt-1'>Tags help you filter by context (e.g. coding, phone, low-energy).</p>
        </div>
      </Main>
    </>
  )
}
