import { createFileRoute, notFound } from '@tanstack/react-router'
import consoleCss from '../console.css?url'
import deskCss from '../desk.css?url'
import schoolCss from '../school.css?url'
import { JoinPage } from '../school/School'
import { schoolMe } from '../school/api'

// Only on a school server: use an invite code and choose a password.
export const Route = createFileRoute('/join')({
  loader: async () => {
    const me = await schoolMe()
    if (!me.campus) throw notFound()
    return me
  },
  head: () => ({
    meta: [
      { title: 'Join · tough2simple' },
      { name: 'robots', content: 'noindex' },
    ],
    links: [deskCss, consoleCss, schoolCss].map((href) => ({
      rel: 'stylesheet',
      href,
    })),
  }),
  component: Page,
})

function Page() {
  return <JoinPage me={Route.useLoaderData()} />
}
