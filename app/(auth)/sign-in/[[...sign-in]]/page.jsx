import { SignIn } from '@clerk/nextjs'
import React from 'react'

const Page = () => {
  return (
    <SignIn forceRedirectUrl="/dashboard" />
  )
}

export default Page