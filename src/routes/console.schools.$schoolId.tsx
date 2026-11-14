import { createFileRoute, notFound } from '@tanstack/react-router'
import { School } from '../console/Console'
import { schoolDetail } from '../console/api'

export const Route = createFileRoute('/console/schools/$schoolId')({
  loader: async ({ params }) => {
    const school = await schoolDetail({ data: { id: params.schoolId } })
    if (!school) throw notFound()
    return school
  },
  component: SchoolPage,
})

// A new key per school so the forms start from that school's own values.
function SchoolPage() {
  const school = Route.useLoaderData()
  return <School key={school.id} school={school} />
}
