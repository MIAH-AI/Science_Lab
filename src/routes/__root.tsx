import { useEffect, useState, type ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import deskCss from '../desk.css?url'

// Link previews need a full address. Change this one line to https://tough2simple.com once that domain is
// connected in Netlify (the lab pages' og:image tags use the same address).
const SITE = 'https://learnwith-nehyy.netlify.app'
const TITLE = 'tough2simple — tough topics, made simple'
const DESCRIPTION =
  'Senior secondary Mathematics, Physics, Chemistry, Biology, Geography and Agricultural Science: plain notes, 3D labs you can move, and timed exam practice.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#FBF7F0' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'tough2simple' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: SITE + '/' },
      { property: 'og:image', content: SITE + '/og-image.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: '/fonts/fonts.css' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'canonical', href: SITE + '/' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  // A crash replaces the whole root, so it needs its own document shell.
  errorComponent: (props) => (
    <RootDocument>
      <Crashed {...props} />
    </RootDocument>
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

const SUBJECTS = [
  ['Mathematics', '/waec-maths-dashboard'],
  ['Physics', '/physics_lab_full'],
  ['Chemistry', '/chemistry-simulations'],
  ['Biology', '/waec-biology-lab'],
  ['Geography', '/waec-geography-lab'],
  ['Agric', '/waec-agric-lab'],
] as const

// Friendly full-page message in the Study Desk style, used for unknown addresses and for crashes.
// It opens in Day, or in Night when a page handed over ?appearance=night.
function Friendly({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  actions: ReactNode
}) {
  const [night, setNight] = useState(false)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('appearance')
    // Browser-only value, read after hydration so the server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNight(param === 'night')
  }, [])
  const q = `?appearance=${night ? 'night' : 'default'}`
  return (
    <div className="sd" data-theme={night ? 'night' : 'day'}>
      <link rel="stylesheet" href={deskCss} />
      <main className="sd-oops">
        <a className="sd-brand" href={'/app' + q}>
          <img src={night ? '/brand/icon-dark.svg' : '/favicon.svg'} alt="" />
          <span>
            tough<b>2</b>simple
          </span>
        </a>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="body">{children}</div>
        <div className="acts">{actions}</div>
        <nav aria-label="Subjects">
          <span>Or jump straight to a subject:</span>
          <div>
            {SUBJECTS.map(([name, path]) => (
              <a key={path} href={path + q}>
                {name}
              </a>
            ))}
          </div>
        </nav>
      </main>
    </div>
  )
}

// Unknown addresses: say so plainly and offer the ways back.
export function NotFound() {
  return (
    <Friendly
      eyebrow="Page not found"
      title="That page isn’t here. The tough part is over."
      actions={
        <>
          <a className="sd-btn primary" href="/app">
            Go to your subjects
          </a>
          <a className="sd-btn ghost" href="/app#practice">
            Exam practice
          </a>
        </>
      }
    >
      <p>
        The link may be old or mistyped. Nothing is broken, and your subjects
        are one click away.
      </p>
    </Friendly>
  )
}

// A crash while showing a page: apologise, offer a retry, and keep the technical detail out of the way.
export function Crashed({
  error,
  reset,
}: {
  error: unknown
  reset?: () => void
}) {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(!window.navigator.onLine)
    console.error(error)
  }, [error])
  return (
    <Friendly
      eyebrow={offline ? 'No connection' : 'Something went wrong'}
      title={
        offline
          ? 'You’re offline right now.'
          : 'That didn’t load. It’s us, not you.'
      }
      actions={
        <>
          <button
            type="button"
            className="sd-btn primary"
            onClick={() => (reset ? reset() : window.location.reload())}
          >
            Try again
          </button>
          <a className="sd-btn ghost" href="/app">
            Go to your subjects
          </a>
        </>
      }
    >
      <p>
        {offline
          ? 'Check your internet connection and try again. Labs you saved for offline use still open from their own pages.'
          : 'Something broke while showing this page. Trying again usually fixes it. Your place in any lab is not affected.'}
      </p>
    </Friendly>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
