import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/react'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className='flex min-h-svh items-center justify-center'>
      <SignUp />
    </div>
  )
}
