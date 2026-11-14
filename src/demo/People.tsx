import { useState } from 'react'
import { ChevronDown, KeyRound, UserCheck, UserPlus, Users } from 'lucide-react'
import { DemoShell, SampleTag } from './DemoShell'
import {
  CLASS_NAMES,
  DEMO_CLASS,
  PEOPLE,
  SCHOOL,
  SEAT_CAP,
  inviteCode,
  type Person,
} from './data'

export function People() {
  return (
    <DemoShell role="admin">
      <PeopleBody />
    </DemoShell>
  )
}

const workLine = (p: Person) =>
  p.kind === 'Teacher'
    ? `${p.work} task${p.work === 1 ? '' : 's'} set`
    : `${p.work} task${p.work === 1 ? '' : 's'} handed in`

function PeopleBody() {
  const [people, setPeople] = useState<Person[]>(PEOPLE)
  const [made, setMade] = useState(0) // invite codes made so far in this demo
  const [notice, setNotice] = useState<{ bad: boolean; text: string } | null>(
    null,
  )
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Person['kind']>('Student')
  const [group, setGroup] = useState(DEMO_CLASS)
  const [list, setList] = useState('')

  const used = people.filter((p) => p.status === 'active').length
  const free = SEAT_CAP - used
  const pending = people.filter((p) => p.status === 'pending')
  const invited = people.filter((p) => p.status === 'invited')
  const members = people.filter(
    (p) => p.status === 'active' || p.status === 'disabled',
  )

  const setStatus = (id: string, status: Person['status']) =>
    setPeople((all) =>
      all.map((p) => (p.id === id ? { ...p, status, code: undefined } : p)),
    )

  // Approving or re-enabling someone takes a seat, and is refused when none is free (roadmap ADM-5).
  function giveSeat(p: Person, verb: string) {
    if (free <= 0) {
      setNotice({
        bad: true,
        text: `${p.name} was not ${verb}. All ${SEAT_CAP} seats are in use. Disable someone who has left, or ask for more seats, then try again.`,
      })
      return
    }
    setStatus(p.id, 'active')
    setNotice({
      bad: false,
      text: `${p.name} was ${verb} and can now sign in.`,
    })
  }

  function invite(names: string[]) {
    const clean = names.map((n) => n.trim()).filter(Boolean)
    if (!clean.length) return
    setPeople((all) => [
      ...all,
      ...clean.map((n, i): Person => ({
        id: `inv-${made + i + 1}`,
        name: n,
        kind,
        group,
        status: 'invited',
        work: 0,
        code: inviteCode(made + i),
      })),
    ])
    setMade(made + clean.length)
    setNotice({
      bad: false,
      text:
        clean.length === 1
          ? `Invite code made for ${clean[0]}.`
          : `${clean.length} invite codes made.`,
    })
  }

  return (
    <>
      <div className="dm-head">
        <h1>People</h1>
        <p>
          Add the teachers and students of {SCHOOL.campuses[0].name}, approve
          them when they join, and stay within the seats your school has.
        </p>
      </div>

      <div className="dm-cols">
        <div>
          <section className="sd-card dm-card dm-seats">
            <div className="dm-list-h">
              <h2>
                <Users size={18} aria-hidden="true" /> Seats
              </h2>
              <SampleTag />
            </div>
            <p className="big">
              <b>{used}</b> of {SEAT_CAP} seats in use
            </p>
            <progress
              max={SEAT_CAP}
              value={used}
              aria-label={`${used} of ${SEAT_CAP} seats in use`}
              className={free <= 0 ? 'full' : undefined}
            />
            <p>
              {free > 0
                ? `${free} seat${free === 1 ? '' : 's'} free. Each approved teacher or student uses one seat.`
                : 'No seats free. Disabling someone frees their seat.'}
            </p>
          </section>

          {notice && (
            <p
              className={`dm-notice${notice.bad ? ' bad' : ''}`}
              role={notice.bad ? 'alert' : 'status'}
            >
              {notice.text}
            </p>
          )}

          <div className="dm-list-h">
            <h2>
              <UserCheck size={18} aria-hidden="true" /> Waiting for your
              approval
            </h2>
            <SampleTag />
          </div>
          <ul className="dm-people" aria-label="Waiting for approval">
            {pending.map((p) => (
              <li key={p.id} className="sd-card">
                <div className="what">
                  <b>{p.name}</b>
                  <span>
                    {p.kind} · {p.group} · joined with a code and set a password
                  </span>
                </div>
                <button
                  type="button"
                  className="sd-btn primary"
                  aria-label={`Approve ${p.name}`}
                  onClick={() => giveSeat(p, 'approved')}
                >
                  Approve
                </button>
              </li>
            ))}
            {!pending.length && (
              <li className="sd-card empty">Nobody is waiting.</li>
            )}
          </ul>

          <div className="dm-list-h">
            <h2>
              <KeyRound size={18} aria-hidden="true" /> Invites not used yet
            </h2>
            <SampleTag />
          </div>
          <ul className="dm-people" aria-label="Invites not used yet">
            {invited.map((p) => (
              <li key={p.id} className="sd-card">
                <div className="what">
                  <b>{p.name}</b>
                  <span>
                    {p.kind} · {p.group} · code <code>{p.code}</code>
                  </span>
                </div>
                <button
                  type="button"
                  className="sd-btn ghost"
                  aria-label={`${p.name} has joined`}
                  title="In the real app this happens when the person types their code and sets a password"
                  onClick={() => setStatus(p.id, 'pending')}
                >
                  They have joined
                </button>
              </li>
            ))}
            {!invited.length && (
              <li className="sd-card empty">No open invites.</li>
            )}
          </ul>

          <div className="dm-list-h">
            <h2>
              <Users size={18} aria-hidden="true" /> Teachers and students
            </h2>
            <SampleTag />
          </div>
          <ul className="dm-people" aria-label="Teachers and students">
            {members.map((p) => (
              <li
                key={p.id}
                className={`sd-card${p.status === 'disabled' ? ' off' : ''}`}
              >
                <div className="what">
                  <b>{p.name}</b>
                  <span>
                    {p.kind} · {p.group} · {workLine(p)}
                    {p.status === 'disabled' &&
                      ' · disabled: cannot sign in, work is kept'}
                  </span>
                </div>
                {p.status === 'active' ? (
                  <button
                    type="button"
                    className="sd-btn ghost"
                    aria-label={`Disable ${p.name}`}
                    onClick={() => {
                      setStatus(p.id, 'disabled')
                      setNotice({
                        bad: false,
                        text: `${p.name} is disabled and cannot sign in. Their seat is free and their recorded work is kept.`,
                      })
                    }}
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sd-btn ghost"
                    aria-label={`Enable ${p.name} again`}
                    onClick={() => giveSeat(p, 'enabled again')}
                  >
                    Enable again
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <aside className="dm-side" aria-label="Invite people">
          <section className="sd-card dm-card">
            <h2>
              <UserPlus size={18} aria-hidden="true" /> Invite people
            </h2>
            <p>
              Student devices are often offline, so an invite is a short code,
              not an email. The person types the code the first time they sign
              in and sets a password. Then they wait for your approval.
            </p>
            <label htmlFor="dm-i-kind">They are a</label>
            <div className="sd-select dm-select">
              <select
                id="dm-i-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as Person['kind'])}
              >
                <option>Student</option>
                <option>Teacher</option>
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
            <label htmlFor="dm-i-group">Class</label>
            <div className="sd-select dm-select">
              <select
                id="dm-i-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                {CLASS_NAMES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                invite([name])
                setName('')
              }}
            >
              <label htmlFor="dm-i-name">One person: their name</label>
              <input
                id="dm-i-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Student 17"
                autoComplete="off"
              />
              <button type="submit" className="sd-btn" disabled={!name.trim()}>
                Make an invite code
              </button>
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                invite(list.split('\n'))
                setList('')
              }}
            >
              <label htmlFor="dm-i-list">
                A whole class: paste the class list, one name on each line
              </label>
              <textarea
                id="dm-i-list"
                rows={4}
                value={list}
                onChange={(e) => setList(e.target.value)}
                placeholder={'Student 17\nStudent 18\nStudent 19'}
              />
              <button
                type="submit"
                className="sd-btn ghost"
                disabled={!list.trim()}
              >
                Make a code for each name
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  )
}
