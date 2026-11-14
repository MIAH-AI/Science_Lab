import { createFileRoute, redirect } from '@tanstack/react-router'
import consoleCss from '../console.css?url'
import deskCss from '../desk.css?url'
import demoCss from '../demo.css?url'
import schoolCss from '../school.css?url'
import { People } from '../demo/People'
import { PeoplePage } from '../school/School'
import { peopleList, schoolMe } from '../school/api'

// On the hosted site this is the demo screen with sample data (doc/roadmap/demo-mode.md).
// On a school server it is the school admin's real People page, behind their sign-in.
export const Route = createFileRoute('/app/people')({
  loader: async () => {
    const me = await schoolMe()
    if (!me.campus) return { real: null }
    if (!me.user) throw redirect({ to: '/signin' })
    const data = await peopleList()
    return { real: data.ok ? data : { denied: true as const } }
  },
  head: () => ({
    meta: [{ title: 'People · tough2simple' }],
    links: [deskCss, demoCss, consoleCss, schoolCss].map((href) => ({
      rel: 'stylesheet',
      href,
    })),
  }),
  component: Page,
})

function Page() {
  const { real } = Route.useLoaderData()
  if (!real) return <People />
  if ('denied' in real)
    return (
      <div className="sd" data-theme="day">
        <main className="sd-oops">
          <p className="eyebrow">School admin only</p>
          <h1>This page is for the school admin.</h1>
          <div className="body">
            <p>You are signed in, but your account cannot manage people.</p>
          </div>
          <div className="acts">
            <a className="sd-btn primary" href="/app">
              Go to the study desk
            </a>
          </div>
        </main>
      </div>
    )
  return <PeoplePage data={real} />
}
