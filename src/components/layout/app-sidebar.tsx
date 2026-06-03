import { useLayout } from '@/context/layout-provider'
import { SlidersHorizontal } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { usePerspectivesData } from '@/hooks/use-perspectives-data'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { perspectives } = usePerspectivesData()

  const navGroups = [
    ...sidebarData.navGroups,
    {
      title: 'Custom Perspectives',
      items: [
        { title: 'Manage Perspectives', url: '/perspectives', icon: SlidersHorizontal },
        ...perspectives.map((perspective: any) => ({
          title: perspective.name,
          url: `/perspectives/${perspective.id}`,
          icon: SlidersHorizontal,
        })),
      ],
    },
  ]

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
