import { createFileRoute } from '@tanstack/react-router'
import { Content } from '../console/Insights'
import { usageGet } from '../console/api'

export const Route = createFileRoute('/console/content')({
  loader: () => usageGet({ data: { days: 30 } }),
  component: ContentPage,
})

function ContentPage() {
  return <Content report={Route.useLoaderData().report} />
}
