import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import deskCss from '../desk.css?url'
import licenceCss from '../licence.css?url'
import { campusStatus, type PublicStatus } from '../campus/status'
import { niceDate } from '../lib/terms'

// Only on a school server: where its licence stands, in plain words, and a way to install a new one.
// On the hosted site this address is "page not found".
export const Route = createFileRoute('/licence')({
  loader: async () => {
    const status = await campusStatus()
    if (!status) throw notFound()
    return status
  },
  head: () => ({
    meta: [
      { title: 'Licence · tough2simple' },
      { name: 'robots', content: 'noindex' },
    ],
    links: [
      { rel: 'stylesheet', href: deskCss },
      { rel: 'stylesheet', href: licenceCss },
    ],
  }),
  component: LicencePage,
})

const TITLE: Record<PublicStatus['state'], string> = {
  valid: 'This server is licensed',
  grace: 'The licence has ended. This server is read-only',
  locked: 'tough2simple is locked on this server',
  'not-started': 'The licence has not started yet',
  'wrong-machine': 'This licence does not belong to this server',
  none: 'This server has no licence yet',
  invalid: 'The licence on this server cannot be read',
}

function LicencePage() {
  const s = Route.useLoaderData()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function install(token: string) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/licence/install', {
        method: 'POST',
        body: token,
      })
      const body = (await res.json()) as { ok: boolean; error?: string }
      if (body.ok) window.location.reload()
      else setError(body.error ?? 'That licence was not accepted.')
    } catch {
      setError('The server did not answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sd" data-theme="day">
      <main className="lc">
        <a className="sd-brand" href={s.canUse ? '/app' : '/licence'}>
          <img src="/favicon.svg" alt="" />
          <span>
            tough<b>2</b>simple
          </span>
        </a>
        <p className={`lc-state ${s.state}`}>
          {s.state === 'valid'
            ? 'Licensed'
            : s.state === 'grace'
              ? 'Read-only'
              : 'Not available'}
        </p>
        <h1>{TITLE[s.state]}</h1>
        <p className="lc-msg">{s.message}</p>
        {!s.canUse && (
          <p className="lc-msg">
            If you are a student, tell your teacher. Nothing is wrong with your
            phone or laptop.
          </p>
        )}
        {s.canUse && (
          <a className="sd-btn primary" href="/app">
            Go to the study desk
          </a>
        )}

        {s.school && (
          <dl className="lc-facts">
            <div>
              <dt>School</dt>
              <dd>{s.school}</dd>
            </div>
            <div>
              <dt>Campus</dt>
              <dd>{s.campus}</dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>{s.kind === 'trial' ? 'Trial' : 'Full licence'}</dd>
            </div>
            {s.starts && s.ends && (
              <div>
                <dt>Runs</dt>
                <dd>
                  {niceDate(s.starts)} to {niceDate(s.ends)}
                </dd>
              </div>
            )}
            {s.state === 'valid' && (
              <div>
                <dt>Days left</dt>
                <dd>{s.daysLeft}</dd>
              </div>
            )}
            {s.locks && s.state !== 'locked' && (
              <div>
                <dt>Read-only until</dt>
                <dd>{niceDate(s.locks)}</dd>
              </div>
            )}
            {s.seats && (
              <div>
                <dt>Seats</dt>
                <dd>{s.seats}</dd>
              </div>
            )}
          </dl>
        )}

        <section className="sd-card lc-admin" aria-label="For the school admin">
          <h2>For the school admin</h2>
          <p>
            To get or extend a licence, send tough2simple this server’s
            fingerprint. A licence is made for one server and cannot be edited.
          </p>
          <div className="lc-print">
            <span>Server fingerprint</span>
            <code>{s.fingerprint}</code>
            <button
              type="button"
              className="sd-btn ghost"
              onClick={() =>
                navigator.clipboard.writeText(s.fingerprint).then(() => {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1800)
                })
              }
            >
              {copied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy fingerprint'}
            </button>
          </div>
          {s.fingerprintSource === 'stored' && (
            <p className="lc-small">
              This computer has no id of its own, so the fingerprint is kept in
              the server’s data folder. Do not delete that folder.
            </p>
          )}
          <form
            aria-label="Install a licence"
            onSubmit={(e) => {
              e.preventDefault()
              install(text)
            }}
          >
            <label htmlFor="lc-file">
              Install a licence: choose the licence file
            </label>
            <input
              id="lc-file"
              type="file"
              accept=".t2s-licence,.txt,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) setText(await file.text())
              }}
            />
            <label htmlFor="lc-text">or paste its contents</label>
            <textarea
              id="lc-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              required
            />
            {error && (
              <p className="lc-error" role="alert">
                {error}
              </p>
            )}
            <button className="sd-btn primary" disabled={busy || !text.trim()}>
              <KeyRound size={17} aria-hidden="true" /> Install licence
            </button>
          </form>
          <p className="lc-small">
            {s.enrolled
              ? 'This server checks in with tough2simple whenever it has an internet connection.'
              : 'This server has not been enrolled online. It works fully offline.'}{' '}
            Version {s.version}.
          </p>
        </section>
      </main>
    </div>
  )
}
