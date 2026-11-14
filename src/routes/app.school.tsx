import { createFileRoute } from '@tanstack/react-router'
import deskCss from '../desk.css?url'
import demoCss from '../demo.css?url'
import { School } from '../demo/School'

// Demo screen with sample data. See doc/roadmap/demo-mode.md.
export const Route = createFileRoute('/app/school')({
  head: () => ({
    meta: [{ title: 'Director demo · tough2simple' }],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: demoCss },
    ],
  }),
  component: School,
})
