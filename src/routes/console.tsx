import {
  Outlet,
  createFileRoute,
  notFound,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import consoleCss from '../console.css?url'
import deskCss from '../desk.css?url'
import { ConsoleFrame } from '../console/Console'
import { consoleState } from '../console/api'

// The platform admin console. It does not exist unless CONSOLE_ENABLED=1 is set: the address answers
// "page not found". Everything inside needs a signed-in platform admin, checked again by each server call.
export const Route = createFileRoute('/console')({
  beforeLoad: async ({ location }) => {
    const state = await consoleState()
    if (!state.enabled) throw notFound()
    const path = location.pathname.replace(/\/$/, '')
    const open =
      path === '/console/signin' ||
      path === '/console/setup' ||
      path.startsWith('/console/invite/')
    if (!state.hasAdmins && path !== '/console/setup')
      throw redirect({ to: '/console/setup' })
    if (state.hasAdmins && path === '/console/setup')
      throw redirect({ to: '/console/signin' })
    if (state.hasAdmins && !state.me && !open)
      throw redirect({ to: '/console/signin' })
    if (state.me && open) throw redirect({ to: '/console' })
    return { state }
  },
  head: () => ({
    meta: [
      { title: 'Console · tough2simple' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: consoleCss },
    ],
  }),
  component: ConsoleLayout,
})

function ConsoleLayout() {
  const { state } = Route.useRouteContext()
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, '') })
  return (
    <ConsoleFrame state={state} path={path}>
      <Outlet />
    </ConsoleFrame>
  )
}
