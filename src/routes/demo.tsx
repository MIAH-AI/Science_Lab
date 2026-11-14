import { createFileRoute } from '@tanstack/react-router'
import deskCss from '../desk.css?url'
import demoCss from '../demo.css?url'
import { Chooser } from '../demo/Chooser'

// Choose a demo role. See doc/roadmap/demo-mode.md.
export const Route = createFileRoute('/demo')({
  head: () => ({
    meta: [{ title: 'Try the demo · tough2simple' }],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: demoCss },
    ],
  }),
  component: Chooser,
})
