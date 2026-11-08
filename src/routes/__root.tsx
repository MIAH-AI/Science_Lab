import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import deskCss from '../desk.css?url'

const SITE = 'https://learnwith-nehyy.netlify.app'
const TITLE = 'Learn with Nehy — WAEC study labs'
const DESCRIPTION =
  'Study your WAEC Mathematics, Physics, Chemistry, Biology and Geography syllabus with 3D labs, notes and timed exam practice.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#FBF7F0' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Learn with Nehy' },
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
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'canonical', href: SITE + '/' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// Unknown addresses get a friendly page with a way back, in the Study Desk style.
function NotFound() {
  return (
    <div className="sd" data-theme="day">
      <link rel="stylesheet" href={deskCss} />
      <main className="sd-404">
        <a className="sd-brand" href="/">
          <img src="/favicon.svg" alt="" />
          <span>
            learnwith<b>nehy.</b>
          </span>
        </a>
        <h1>We can’t find that page</h1>
        <p>
          The link may be old or mistyped. Your subjects are one click away.
        </p>
        <a className="sd-btn primary" href="/">
          Go to your subjects
        </a>
      </main>
    </div>
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
