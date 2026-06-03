import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/react'

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className='flex min-h-svh items-center justify-center'>
      <SignIn />
    </div>
  )
}
