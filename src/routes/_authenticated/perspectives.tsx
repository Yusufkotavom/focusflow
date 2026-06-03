import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { PerspectivesManage } from '@/features/perspectives/manage'

export const Route = createFileRoute('/_authenticated/perspectives')({
  component: PerspectivesRoute,
})

function PerspectivesRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (pathname === '/perspectives') {
    return <PerspectivesManage />
  }

  return <Outlet />
}
