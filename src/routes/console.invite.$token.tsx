import { createFileRoute } from '@tanstack/react-router'
import { AcceptInvite } from '../console/Console'

export const Route = createFileRoute('/console/invite/$token')({
  component: InvitePage,
})

function InvitePage() {
  return <AcceptInvite token={Route.useParams().token} />
}
