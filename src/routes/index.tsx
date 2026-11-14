import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import marketingCss from '../marketing.css?url'
import { Marketing } from '../marketing/Marketing'
import { toDesign, type Design } from '../marketing/content'

// Which of the three front page designs visitors see. A platform admin sets MARKETING_DESIGN to a, b or c
// in the site's environment settings (Netlify) and redeploys; anything else, or nothing, means the default (c).
// It is read on the server, so the choice never ships to the browser as something a visitor could change.
const siteDesign = createServerFn({ method: 'GET' }).handler((): Design =>
  toDesign(process.env.MARKETING_DESIGN),
)

export const Route = createFileRoute('/')({
  // ?design=a, b or c previews a design without changing the setting.
  validateSearch: (search: Record<string, unknown>): { design?: Design } =>
    typeof search.design === 'string'
      ? { design: toDesign(search.design) }
      : {},
  loader: () => siteDesign(),
  head: () => ({ links: [{ rel: 'stylesheet', href: marketingCss }] }),
  component: FrontPage,
})

function FrontPage() {
  const preview = Route.useSearch().design
  const chosen = Route.useLoaderData()
  return <Marketing design={preview ?? chosen} />
}
