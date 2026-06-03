import {
  Inbox,
  CalendarDays,
  FolderOpen,
  Tags,
  CheckCircle2,
  Flag,
  Activity,
  ListTodo,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'OmniFocus Clone',
      logo: CheckCircle2,
      plan: 'Personal',
    },
  ],
  navGroups: [
    {
      title: 'Views',
      items: [
        {
          title: 'Inbox',
          url: '/',
          icon: Inbox,
          badge: '12',
        },
        {
          title: 'Forecast',
          url: '/forecast',
          icon: CalendarDays,
        },
        {
          title: 'Projects',
          url: '/projects',
          icon: FolderOpen,
        },
        {
          title: 'Tags',
          url: '/tags',
          icon: Tags,
        },
        {
          title: 'Review',
          url: '/review',
          icon: Activity,
        },
      ],
    },
    {
      title: 'Perspectives',
      items: [
        {
          title: 'Flagged',
          url: '/flagged',
          icon: Flag,
        },
        {
          title: 'Available',
          url: '/available',
          icon: ListTodo,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
