import { createFileRoute } from '@tanstack/react-router'
import { Schools } from '../console/Console'
import { schoolsList } from '../console/api'

export const Route = createFileRoute('/console/')({
  loader: () => schoolsList(),
  component: SchoolsPage,
})

function SchoolsPage() {
  const schools = Route.useLoaderData()
  const { state } = Route.useRouteContext()
  return <Schools schools={schools} state={state} />
}
