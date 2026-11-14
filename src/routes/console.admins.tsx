import { createFileRoute } from '@tanstack/react-router'
import { Admins } from '../console/Console'
import { adminsList } from '../console/api'

export const Route = createFileRoute('/console/admins')({
  loader: () => adminsList(),
  component: AdminsPage,
})

function AdminsPage() {
  const admins = Route.useLoaderData()
  const { state } = Route.useRouteContext()
  return <Admins admins={admins} me={state.me?.id ?? ''} />
}
