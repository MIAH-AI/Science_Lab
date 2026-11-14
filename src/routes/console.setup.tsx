import { createFileRoute } from '@tanstack/react-router'
import { Setup } from '../console/Console'

export const Route = createFileRoute('/console/setup')({
  component: () => <Setup />,
})
