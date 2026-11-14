import { createFileRoute } from '@tanstack/react-router'
import { Overview } from '../console/Insights'
import { overviewGet } from '../console/api'

export const Route = createFileRoute('/console/')({
  loader: () => overviewGet(),
  component: OverviewPage,
})

function OverviewPage() {
  const { state } = Route.useRouteContext()
  return <Overview {...Route.useLoaderData()} state={state} />
}
