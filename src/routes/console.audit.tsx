import { createFileRoute } from '@tanstack/react-router'
import { Audit } from '../console/Console'
import { auditList } from '../console/api'

export const Route = createFileRoute('/console/audit')({
  loader: () => auditList(),
  component: AuditPage,
})

function AuditPage() {
  return <Audit entries={Route.useLoaderData()} />
}
