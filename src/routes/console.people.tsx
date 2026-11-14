import { createFileRoute } from '@tanstack/react-router'
import { People } from '../console/Insights'
import { schoolsList } from '../console/api'

export const Route = createFileRoute('/console/people')({
  loader: () => schoolsList(),
  component: PeoplePage,
})

function PeoplePage() {
  return <People schools={Route.useLoaderData()} />
}
