// Words, links and pictures shared by the three marketing page designs.
// Every figure here is one the app itself shows on the Study Desk; the pictures are real screenshots.
import type { SubjectKey } from '../lib/topics'

export type Design = 'a' | 'b' | 'c'
export const DESIGNS: Design[] = ['a', 'b', 'c']
export const DEFAULT_DESIGN: Design = 'c'

// Accepts whatever the site setting or the ?design= preview holds and falls back to the default.
export function toDesign(value: unknown): Design {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return (DESIGNS as string[]).includes(v) ? (v as Design) : DEFAULT_DESIGN
}

export type Subject = {
  key: SubjectKey
  name: string
  facts: string
  path: string
  // Day colours, the same as the Study Desk's subject colours.
  colour: string
  tint: string
  shot: string
  shotAlt: string
  // One topic as it reads on paper, for the "tough 2 simple" comparison.
  topic: string
  onPaper: string
}

export const subjects: Subject[] = [
  {
    key: 'maths',
    name: 'Mathematics',
    facts: 'Core + Further · 94 simulations',
    path: '/waec-maths-dashboard',
    colour: '#5e44a8',
    tint: '#eee9fa',
    shot: '/marketing/maths.webp',
    shotAlt:
      'The Mathematics lab: three rays meeting at a point, with sliders that turn each ray and the angles adding up to 360 degrees',
    topic: 'Angles at a point',
    onPaper:
      'Angles at a point (360°); angles on a straight line (180°); vertically opposite angles.',
  },
  {
    key: 'physics',
    name: 'Physics',
    facts: '41 topics · 163 3D sim modes',
    path: '/physics_lab_full',
    colour: '#a84a17',
    tint: '#fcede2',
    shot: '/marketing/physics.webp',
    shotAlt:
      'The Physics lab: a moving electromagnetic wave with a slider that sweeps from radio waves to gamma rays',
    topic: 'Electromagnetic waves',
    onPaper:
      'Types of radiation in the EM spectrum: radio, infrared, visible light, ultraviolet, X-rays, gamma rays. Elementary description and uses. c = fλ for all EM waves.',
  },
  {
    key: 'chemistry',
    name: 'Chemistry',
    facts: '148 subtopics · 97 3D modules',
    path: '/chemistry-simulations',
    colour: '#0f6e5e',
    tint: '#dff2ec',
    shot: '/marketing/chemistry.webp',
    shotAlt:
      'The Chemistry lab: a measuring cylinder on a bench that you read at eye level, with a check on your reading',
    topic: 'Reading a measuring cylinder',
    onPaper:
      'Practise reading a measuring cylinder, thermometer and balance: meniscus, parallax, divisions and significant figures.',
  },
  {
    key: 'biology',
    name: 'Biology',
    facts: '99 subtopics · 92 3D labs',
    path: '/waec-biology-lab',
    colour: '#3a7019',
    tint: '#e8f3de',
    shot: '/marketing/biology.webp',
    shotAlt:
      'The Biology lab: a 3D model of the human muscles with labels, which you can turn and tap',
    topic: 'Skeleton and muscles',
    onPaper:
      'Relationship of skeleton and muscles during movement. Detailed skull and bone histology not required.',
  },
  {
    key: 'geography',
    name: 'Geography',
    facts: '144 subtopics · 3D maps',
    path: '/waec-geography-lab',
    colour: '#1e5a9e',
    tint: '#e2ecf9',
    shot: '/marketing/geography.webp',
    shotAlt:
      'The Geography lab: a bar graph of West African populations that switches to a line graph or a pie chart',
    topic: 'Bar graphs and pie charts',
    onPaper:
      'Bar graphs, line graphs and pie charts. Bars for discrete data, lines for continuous change over time.',
  },
  {
    key: 'agric',
    name: 'Agricultural Science',
    facts: '274 subtopics · 196 3D farm labs',
    path: '/waec-agric-lab',
    colour: '#7f5418',
    tint: '#f6ecdc',
    shot: '/marketing/agric.webp',
    shotAlt:
      'The Agricultural Science lab: a 3D farm with labelled areas for crops, forestry, fisheries and animals',
    topic: 'Branches of agriculture',
    onPaper:
      'Meaning and importance of agriculture. Name a branch and give one area of study or job in it.',
  },
]

export type Role = {
  key: 'student' | 'teacher' | 'admin' | 'principal' | 'director'
  name: string
  does: string
  path: string
}

// The five roles a visitor can try. Paths and the ?role= values are defined in doc/roadmap/demo-mode.md.
export const roles: Role[] = [
  {
    key: 'student',
    name: 'Student',
    does: 'Search a topic, open its 3D lab, then test yourself with timed questions.',
    path: '/app?role=student',
  },
  {
    key: 'teacher',
    name: 'Teacher',
    does: 'Put a lab on the board, run a class practice paper and set tasks for a class.',
    path: '/app/classroom?role=teacher',
  },
  {
    key: 'admin',
    name: 'School admin',
    does: 'Add teachers and students, approve them and keep within your seats.',
    path: '/app/people?role=admin',
  },
  {
    key: 'principal',
    name: 'Principal',
    does: 'See how each class in your campus uses the labs and finishes its tasks.',
    path: '/app/campus?role=principal',
  },
  {
    key: 'director',
    name: 'Director',
    does: 'See every campus of your school in one place.',
    path: '/app/school?role=director',
  },
]

export const steps = [
  {
    title: 'Read the notes',
    text: 'Each topic opens with the syllabus points and the examiner’s tips, in plain words.',
    shot: '/marketing/chemistry.webp',
    shotAlt: 'A Chemistry topic open on its notes and lab',
  },
  {
    title: 'Try the 3D lab',
    text: 'Move a slider and watch what changes. The formula and the readings update as you go.',
    shot: '/marketing/physics-stage.webp',
    shotAlt: 'A wave in the Physics lab, changing as a slider moves',
  },
  {
    title: 'Test yourself',
    text: 'Timed, exam-style questions with worked solutions. Fresh questions every time.',
    shot: '/marketing/exam.webp',
    shotAlt: 'Exam practice: choose the paper, the length and the topics',
  },
]

// What a school gets, with an honest state for each line.
export const school = [
  {
    title: 'Labs that open offline',
    text: 'Save a subject on a phone or laptop and use it with no data.',
    state: 'Ready',
  },
  {
    title: 'Tools for teachers and school leaders',
    text: 'Put a lab on the board, set tasks and see class progress. Try them in the demo with a sample school.',
    state: 'Preview',
  },
  {
    title: 'Campus server',
    text: 'The whole school works from one box on the school network, with no internet.',
    state: 'In development',
  },
] as const

export const TRY = ['Photosynthesis', 'Logarithms', 'Refraction', 'Titration']

export const SMALL_PRINT =
  'Topics follow the WAEC senior secondary syllabus today. tough2simple is an independent study companion and is not affiliated with WAEC.'
