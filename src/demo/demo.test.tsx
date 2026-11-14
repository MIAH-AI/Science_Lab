import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route as DeskRoute } from '../routes/app.index'
import { Campus } from './Campus'
import { Chooser } from './Chooser'
import { Classroom } from './Classroom'
import { People } from './People'
import { School } from './School'
import { ROLES, SEAT_CAP, STUDENTS, TASKS, topicsOf } from './data'

const Desk = DeskRoute.options.component!

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  window.history.replaceState(null, '', '/')
})
afterEach(() => vi.useRealTimers())

const bar = () => screen.getByRole('complementary', { name: 'Demo' })
const list = (name: string) => screen.getByRole('list', { name })

describe('demo bar', () => {
  it.each([
    ['teacher', Classroom, 'Teacher'],
    ['admin', People, 'School admin'],
    ['principal', Campus, 'Principal'],
    ['director', School, 'Director'],
  ] as const)(
    'the %s screen says it is a demo with sample data',
    (_, Screen, label) => {
      render(<Screen />)
      expect(within(bar()).getByText('Demo · sample data')).toBeInTheDocument()
      expect(bar()).toHaveTextContent(`You are viewing as ${label}`)
      expect(within(bar()).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      )
      // every block of figures or people is tagged
      expect(screen.getAllByText('Sample data').length).toBeGreaterThan(0)
    },
  )

  it('switches role with links that carry the role and Day or Night', () => {
    window.history.replaceState(null, '', '/app/classroom?appearance=night')
    render(<Classroom />)
    const links = within(
      screen.getByRole('navigation', { name: 'Demo roles' }),
    ).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/app?role=student&appearance=night',
      '/app/classroom?role=teacher&appearance=night',
      '/app/people?role=admin&appearance=night',
      '/app/campus?role=principal&appearance=night',
      '/app/school?role=director&appearance=night',
    ])
    expect(
      within(bar()).getByRole('link', { name: /Exit demo/ }),
    ).toHaveAttribute('href', '/')
  })

  it('role chooser offers all five roles', () => {
    render(<Chooser />)
    const links = within(list('Roles')).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      ROLES.map((r) => `${r.path}?role=${r.key}&appearance=default`),
    )
  })
})

describe('teacher', () => {
  it('opens the chosen subject on the board, with the lesson timer when it is running', () => {
    vi.useFakeTimers()
    render(<Classroom />)
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Subject' })).getByRole(
        'button',
        { name: 'Physics' },
      ),
    )
    const topics = within(screen.getByRole('group', { name: 'Topic' }))
    expect(topics.getAllByRole('button')).toHaveLength(
      topicsOf('physics').length,
    )
    const board = () =>
      screen.getByRole('link', { name: 'Open Physics on the board' })
    expect(board()).toHaveAttribute(
      'href',
      '/physics_lab_full?appearance=default',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start the timer' }))
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('timer')).toHaveTextContent('14:58')
    expect(board().getAttribute('href')).toMatch(
      /^\/physics_lab_full\?appearance=default&focus=\d+-15$/,
    )
    expect(
      screen.getByRole('link', { name: 'Project the paper' }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/waec-biology-lab\?.*#exam$/),
    )
  })

  it('sets a task and shows it at the top of the list with nobody done yet', () => {
    render(<Classroom />)
    const form = screen.getByRole('form', { name: 'Set a task' })
    fireEvent.change(within(form).getByLabelText('Subject'), {
      target: { value: 'chemistry' },
    })
    const topic = topicsOf('chemistry')[3]
    fireEvent.change(within(form).getByLabelText('Topic'), {
      target: { value: topic },
    })
    fireEvent.change(within(form).getByLabelText('Class'), {
      target: { value: 'SS3 Science' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Set task' }))
    const items = within(list('Tasks you have set')).getAllByRole('listitem')
    expect(items).toHaveLength(TASKS.length + 1)
    expect(items[0]).toHaveTextContent(topic)
    expect(items[0]).toHaveTextContent('Chemistry · SS3 Science')
    expect(items[0]).toHaveTextContent(`0 of ${STUDENTS.length} done`)
  })

  it('shows who has done a task, and Restart demo puts the sample back', () => {
    render(<Classroom />)
    const first = within(list('Tasks you have set')).getAllByRole('listitem')[0]
    fireEvent.click(
      within(first).getByRole('button', { name: 'See who has done it' }),
    )
    const names = within(list(`Class list for ${TASKS[0].topic}`)).getAllByRole(
      'listitem',
    )
    expect(names).toHaveLength(STUDENTS.length)
    expect(names.filter((li) => li.textContent?.includes('Done'))).toHaveLength(
      TASKS[0].done.length,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Set task' }))
    expect(
      within(list('Tasks you have set')).getAllByText(/of 12 done/),
    ).toHaveLength(TASKS.length + 1)
    fireEvent.click(within(bar()).getByRole('button', { name: /Restart demo/ }))
    expect(
      within(list('Tasks you have set')).getAllByText(/of 12 done/),
    ).toHaveLength(TASKS.length)
  })
})

describe('school admin', () => {
  const seats = () => screen.getByRole('progressbar', { name: /seats in use/ })

  it('refuses an approval that would go over the seat cap', () => {
    render(<People />)
    expect(seats()).toHaveAccessibleName(`16 of ${SEAT_CAP} seats in use`)
    fireEvent.click(screen.getByRole('button', { name: 'Approve Student 13' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve Student 14' }))
    expect(seats()).toHaveAccessibleName(`18 of ${SEAT_CAP} seats in use`)
    fireEvent.click(screen.getByRole('button', { name: 'Approve Student 15' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Student 15 was not approved. All 18 seats are in use.',
    )
    expect(seats()).toHaveAccessibleName(`18 of ${SEAT_CAP} seats in use`)
    expect(
      within(list('Waiting for approval')).getByText('Student 15'),
    ).toBeInTheDocument()
  })

  it('disabling frees a seat and keeps the recorded work', () => {
    render(<People />)
    const row = () =>
      within(list('Teachers and students'))
        .getByText('Student 01')
        .closest('li')!
    const work = /\d+ tasks? handed in/.exec(row().textContent!)![0]
    fireEvent.click(screen.getByRole('button', { name: 'Disable Student 01' }))
    expect(seats()).toHaveAccessibleName(`15 of ${SEAT_CAP} seats in use`)
    expect(row()).toHaveTextContent(work)
    expect(row()).toHaveTextContent('disabled: cannot sign in, work is kept')
    // the freed seat can be used: all three waiting students now fit
    for (const n of [13, 14, 15])
      fireEvent.click(
        screen.getByRole('button', { name: `Approve Student ${n}` }),
      )
    expect(seats()).toHaveAccessibleName(`18 of ${SEAT_CAP} seats in use`)
    // and there is no seat left to enable the disabled student again
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Student 01 again' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Student 01 was not enabled again',
    )
  })

  it('makes an invite code for each name in a pasted class list, and a joined invite waits for approval', () => {
    render(<People />)
    fireEvent.change(screen.getByLabelText(/paste the class list/), {
      target: { value: 'Student 21\n\n  Student 22 \nStudent 23' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Make a code for each name' }),
    )
    const invites = within(list('Invites not used yet'))
    expect(invites.getAllByRole('listitem')).toHaveLength(4)
    const codes = invites
      .getAllByRole('listitem')
      .map((li) => /DSS-\w+/.exec(li.textContent!)![0])
    expect(new Set(codes).size).toBe(4)
    // invites do not use seats
    expect(seats()).toHaveAccessibleName(`16 of ${SEAT_CAP} seats in use`)
    fireEvent.click(
      screen.getByRole('button', { name: 'Student 22 has joined' }),
    )
    expect(
      within(list('Waiting for approval')).getByText('Student 22'),
    ).toBeInTheDocument()
  })
})

describe('principal and director', () => {
  it('principal sees one campus only', () => {
    render(<Campus />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Main Campus' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('North Campus')).toBeNull()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 3)
  })

  it('director sees every campus, and activity without names', () => {
    render(<School />)
    expect(
      screen.getByRole('region', { name: 'Main Campus' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'North Campus' }),
    ).toBeInTheDocument()
    const activity = list('Recent activity')
    expect(within(activity).getAllByRole('listitem').length).toBeGreaterThan(3)
    expect(activity.textContent).not.toMatch(/Student \d|Teacher [A-F]\b/)
    expect(activity).toHaveTextContent('Learner 4F2 opened a lab')
    expect(screen.getByText(/Names are hidden here/)).toBeInTheDocument()
  })
})

describe('student demo on the Study Desk', () => {
  it('adds the demo bar and sample tasks only when ?role=student', () => {
    const { unmount } = render(<Desk />)
    expect(screen.queryByRole('complementary', { name: 'Demo' })).toBeNull()
    expect(screen.queryByText('Your tasks')).toBeNull()
    unmount()

    window.history.replaceState(null, '', '/app?role=student')
    render(<Desk />)
    expect(bar()).toHaveTextContent('You are viewing as Student')
    const tasks = screen.getByRole('region', { name: 'Your tasks' })
    expect(within(tasks).getByText('Sample data')).toBeInTheDocument()
    expect(within(tasks).getAllByRole('checkbox')).toHaveLength(TASKS.length)
    // lab links keep the role
    expect(
      within(tasks).getAllByRole('link', { name: 'Open lab' })[0],
    ).toHaveAttribute(
      'href',
      '/physics_lab_full?appearance=default&role=student',
    )
    expect(
      screen.getAllByRole('link', { name: 'Practise' })[0].getAttribute('href'),
    ).toContain('role=student')
  })

  it('ticks a task done for this visit, and Restart demo clears it', () => {
    window.history.replaceState(null, '', '/app?role=student')
    render(<Desk />)
    const tasks = () => screen.getByRole('region', { name: 'Your tasks' })
    expect(tasks()).toHaveTextContent('3 to do')
    fireEvent.click(within(tasks()).getAllByRole('checkbox')[0])
    expect(tasks()).toHaveTextContent('2 to do')
    fireEvent.click(within(bar()).getByRole('button', { name: /Restart demo/ }))
    expect(tasks()).toHaveTextContent('3 to do')
  })
})
