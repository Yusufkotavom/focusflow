import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: AuthGuard,
})

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/sign-in', replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded) return null

  if (!isSignedIn) return null

  return <AuthenticatedLayout />
}
