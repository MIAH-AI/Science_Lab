import { createFileRoute } from '@tanstack/react-router'
import deskCss from '../desk.css?url'
import demoCss from '../demo.css?url'
import { Campus } from '../demo/Campus'

// Demo screen with sample data. See doc/roadmap/demo-mode.md.
export const Route = createFileRoute('/app/campus')({
  head: () => ({
    meta: [{ title: 'Principal demo · tough2simple' }],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: demoCss },
    ],
  }),
  component: Campus,
})
