// Sample data for the public demo (see doc/roadmap/demo-mode.md).
// Everything here is fictional: the school, the people and every figure. It is shown only on demo screens,
// under a "Demo · sample data" bar, and never on the real Study Desk.
import { index, type SubjectKey } from '../lib/topics'

export type RoleKey = 'student' | 'teacher' | 'admin' | 'principal' | 'director'

export const ROLES: {
  key: RoleKey
  label: string
  path: string
  does: string
}[] = [
  {
    key: 'student',
    label: 'Student',
    path: '/app',
    does: 'Search a topic, open its 3D lab, then test yourself with timed questions.',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    path: '/app/classroom',
    does: 'Put a lab on the board, run a class practice paper and set tasks for a class.',
  },
  {
    key: 'admin',
    label: 'School admin',
    path: '/app/people',
    does: 'Add teachers and students, approve them and keep within your seats.',
  },
  {
    key: 'principal',
    label: 'Principal',
    path: '/app/campus',
    does: 'See how each class in your campus uses the labs and finishes its tasks.',
  },
  {
    key: 'director',
    label: 'Director',
    path: '/app/school',
    does: 'See every campus of your school in one place.',
  },
]

export const isRole = (value: string | null): value is RoleKey =>
  ROLES.some((r) => r.key === value)

// The role, Day or Night and a running focus timer all travel in the address, so nothing is stored.
export function roleHref(role: RoleKey, night: boolean, focus = '') {
  const { path } = ROLES.find((r) => r.key === role)!
  return `${path}?role=${role}&appearance=${night ? 'night' : 'default'}${focus ? `&focus=${focus}` : ''}`
}

export const SUBJECTS: { key: SubjectKey; name: string; path: string }[] = [
  { key: 'maths', name: 'Mathematics', path: '/waec-maths-dashboard' },
  { key: 'physics', name: 'Physics', path: '/physics_lab_full' },
  { key: 'chemistry', name: 'Chemistry', path: '/chemistry-simulations' },
  { key: 'biology', name: 'Biology', path: '/waec-biology-lab' },
  { key: 'geography', name: 'Geography', path: '/waec-geography-lab' },
  { key: 'agric', name: 'Agricultural Science', path: '/waec-agric-lab' },
]
export const subject = (key: SubjectKey) => SUBJECTS.find((s) => s.key === key)!

// Real topic titles from the labs, so every sample task points at something that exists.
export const topicsOf = (key: SubjectKey) => index[key].map((t) => t.t)
const topic = (key: SubjectKey, n: number) =>
  index[key][Math.min(n, index[key].length - 1)].t

export const SCHOOL = {
  name: 'Demo Secondary School',
  campuses: [
    { id: 'main', name: 'Main Campus' },
    { id: 'north', name: 'North Campus' },
  ],
} as const
export type CampusId = (typeof SCHOOL.campuses)[number]['id']

const two = (n: number) => String(n).padStart(2, '0')

// ---------------------------------------------------------------- Teacher: one class and its tasks
export const DEMO_CLASS = 'SS2 Science'
export const CLASS_NAMES = ['SS1 Science', 'SS2 Science', 'SS3 Science']
export const STUDENTS = Array.from({ length: 12 }, (_, i) => ({
  id: `s${two(i + 1)}`,
  name: `Student ${two(i + 1)}`,
}))

export type Task = {
  id: string
  subject: SubjectKey
  topic: string
  className: string
  due: string
  done: string[] // ids of the students who have handed it in
}
export const DUE_OPTIONS = ['Tomorrow', 'This Friday', 'Next week']
// "This Friday" in a menu, "due this Friday" in a sentence.
export const dueText = (due: string) => due[0].toLowerCase() + due.slice(1)

export const TASKS: Task[] = [
  {
    id: 't1',
    subject: 'physics',
    topic: topic('physics', 19),
    className: DEMO_CLASS,
    due: 'This Friday',
    done: ['s01', 's02', 's03', 's05', 's06', 's08', 's09', 's11'],
  },
  {
    id: 't2',
    subject: 'chemistry',
    topic: topic('chemistry', 2),
    className: DEMO_CLASS,
    due: 'Next week',
    done: ['s02', 's05', 's09'],
  },
  {
    id: 't3',
    subject: 'biology',
    topic: topic('biology', 1),
    className: DEMO_CLASS,
    due: 'Tomorrow',
    done: STUDENTS.filter((s) => s.id !== 's07').map((s) => s.id),
  },
]

// ---------------------------------------------------------------- School admin: people and seats
export type PersonStatus = 'invited' | 'pending' | 'active' | 'disabled'
export type Person = {
  id: string
  name: string
  kind: 'Teacher' | 'Student'
  group: string // class, or the subject a teacher takes
  status: PersonStatus
  work: number // tasks handed in (students) or tasks set (teachers); kept when the person is disabled
  code?: string // invite code, while the invite is unused
}

// Seats count approved (active) people. 16 are active and 3 are waiting, so the third approval is refused.
export const SEAT_CAP = 18

export const PEOPLE: Person[] = [
  ...['Physics', 'Chemistry', 'Biology', 'Mathematics'].map(
    (group, i): Person => ({
      id: `m-t${i + 1}`,
      name: `Teacher ${'ABCD'[i]}`,
      kind: 'Teacher',
      group,
      status: 'active',
      work: [6, 4, 5, 3][i],
    }),
  ),
  ...STUDENTS.map((s, i): Person => ({
    id: `m-${s.id}`,
    name: s.name,
    kind: 'Student',
    group: DEMO_CLASS,
    status: 'active',
    work: TASKS.filter((t) => t.done.includes(s.id)).length + (i % 3),
  })),
  ...[13, 14, 15].map((n): Person => ({
    id: `m-s${n}`,
    name: `Student ${n}`,
    kind: 'Student',
    group: DEMO_CLASS,
    status: 'pending',
    work: 0,
  })),
  {
    id: 'm-s16',
    name: 'Student 16',
    kind: 'Student',
    group: DEMO_CLASS,
    status: 'invited',
    work: 0,
    code: 'DSS-4K7P',
  },
]

// Invite codes for the demo come from a fixed list, so a restart gives the same codes again.
const CODE_TAILS = [
  '8Q2M',
  '3T9W',
  '6H4R',
  '2N7C',
  '9B5X',
  '5J3L',
  '7D8V',
  '4P6G',
]
export const inviteCode = (n: number) =>
  `DSS-${CODE_TAILS[n % CODE_TAILS.length]}${n >= CODE_TAILS.length ? Math.floor(n / CODE_TAILS.length) : ''}`

// ---------------------------------------------------------------- Principal and Director: campus figures
export type ClassRow = {
  name: string
  teacher: string
  students: number
  tasksSet: number
  completion: number // per cent of set tasks handed in
}
export type CampusSummary = {
  id: CampusId
  name: string
  students: number
  teachers: number
  seatsUsed: number
  seatCap: number
  completion: number
  labSessions: number // lab sessions this week
  lastUpdate: string
  classes: ClassRow[]
  usage: { subject: SubjectKey; sessions: number }[]
}

export const CAMPUSES: CampusSummary[] = [
  {
    id: 'main',
    name: 'Main Campus',
    students: 96,
    teachers: 4,
    seatsUsed: 100,
    seatCap: 120,
    completion: 72,
    labSessions: 318,
    lastUpdate: '2 minutes ago',
    classes: [
      {
        name: 'SS1 Science',
        teacher: 'Teacher A',
        students: 34,
        tasksSet: 5,
        completion: 81,
      },
      {
        name: 'SS2 Science',
        teacher: 'Teacher B',
        students: 32,
        tasksSet: 6,
        completion: 70,
      },
      {
        name: 'SS3 Science',
        teacher: 'Teacher C',
        students: 30,
        tasksSet: 7,
        completion: 64,
      },
    ],
    usage: [
      { subject: 'physics', sessions: 84 },
      { subject: 'chemistry', sessions: 71 },
      { subject: 'biology', sessions: 66 },
      { subject: 'maths', sessions: 52 },
      { subject: 'agric', sessions: 27 },
      { subject: 'geography', sessions: 18 },
    ],
  },
  {
    id: 'north',
    name: 'North Campus',
    students: 58,
    teachers: 3,
    seatsUsed: 61,
    seatCap: 80,
    completion: 58,
    labSessions: 143,
    lastUpdate: '11 minutes ago',
    classes: [
      {
        name: 'SS1 Science',
        teacher: 'Teacher E',
        students: 30,
        tasksSet: 4,
        completion: 63,
      },
      {
        name: 'SS2 Science',
        teacher: 'Teacher F',
        students: 28,
        tasksSet: 5,
        completion: 52,
      },
    ],
    usage: [
      { subject: 'biology', sessions: 41 },
      { subject: 'maths', sessions: 34 },
      { subject: 'physics', sessions: 29 },
      { subject: 'chemistry', sessions: 22 },
      { subject: 'geography', sessions: 11 },
      { subject: 'agric', sessions: 6 },
    ],
  },
]

// What a director sees on the cloud portal: activity without names (the roadmap's default).
// "Learner 4F2" is a stand-in code, not a student's name or number.
export type Activity = {
  who: string
  campus: CampusId
  what: string
  subject: SubjectKey
  topic: string
  when: string
}
export const ACTIVITY: Activity[] = [
  {
    who: 'Learner 4F2',
    campus: 'main',
    what: 'opened a lab',
    subject: 'physics',
    topic: topic('physics', 19),
    when: '2 min ago',
  },
  {
    who: 'Learner 9C7',
    campus: 'north',
    what: 'handed in a task',
    subject: 'biology',
    topic: topic('biology', 1),
    when: '5 min ago',
  },
  {
    who: 'Teacher 2A1',
    campus: 'main',
    what: 'set a task',
    subject: 'chemistry',
    topic: topic('chemistry', 2),
    when: '9 min ago',
  },
  {
    who: 'Learner 1B8',
    campus: 'main',
    what: 'finished a practice paper',
    subject: 'maths',
    topic: topic('maths', 1),
    when: '14 min ago',
  },
  {
    who: 'Learner 6D3',
    campus: 'north',
    what: 'opened a lab',
    subject: 'geography',
    topic: topic('geography', 0),
    when: '21 min ago',
  },
  {
    who: 'Learner 3E5',
    campus: 'main',
    what: 'handed in a task',
    subject: 'agric',
    topic: topic('agric', 0),
    when: '26 min ago',
  },
]

// ---------------------------------------------------------------- Student: tasks from the demo teacher
export const STUDENT_TASKS = TASKS.map((t) => ({
  id: t.id,
  subject: t.subject,
  topic: t.topic,
  due: t.due,
  from: 'Teacher B',
}))
