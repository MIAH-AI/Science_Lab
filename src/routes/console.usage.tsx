import { createFileRoute } from '@tanstack/react-router'
import { Usage } from '../console/Insights'
import { usageGet } from '../console/api'

// ?days=7|30|90 and ?source=web|<campus id> choose what is shown; both are checked again on the server.
export const Route = createFileRoute('/console/usage')({
  validateSearch: (s: Record<string, unknown>) => ({
    days: Number(s.days) || 30,
    source: typeof s.source === 'string' ? s.source : '',
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    usageGet({ data: { days: deps.days, source: deps.source || undefined } }),
  component: UsagePage,
})

function UsagePage() {
  return <Usage {...Route.useLoaderData()} />
}
