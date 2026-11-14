import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '../console/Console'

export const Route = createFileRoute('/console/signin')({
  component: () => <SignIn />,
})
