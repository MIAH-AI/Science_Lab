import { createFileRoute } from '@tanstack/react-router'
import deskCss from '../desk.css?url'
import demoCss from '../demo.css?url'
import { People } from '../demo/People'

// Demo screen with sample data. See doc/roadmap/demo-mode.md.
export const Route = createFileRoute('/app/people')({
  head: () => ({
    meta: [{ title: 'School admin demo · tough2simple' }],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: demoCss },
    ],
  }),
  component: People,
})
