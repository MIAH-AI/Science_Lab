import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import consoleCss from '../console.css?url'
import deskCss from '../desk.css?url'
import schoolCss from '../school.css?url'
import { SignInPage } from '../school/School'
import { schoolMe } from '../school/api'

// Only on a school server. On the hosted site this address is "page not found".
export const Route = createFileRoute('/signin')({
  loader: async () => {
    const me = await schoolMe()
    if (!me.campus) throw notFound()
    if (me.user)
      throw redirect({ to: me.user.role === 'admin' ? '/app/people' : '/app' })
    return me
  },
  head: () => ({
    meta: [
      { title: 'Sign in · tough2simple' },
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
  return <SignInPage me={Route.useLoaderData()} />
}
