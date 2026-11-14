import type { CSSProperties } from 'react'
import {
  Atom,
  FlaskConical,
  Globe,
  Leaf,
  Sigma,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import type { SubjectKey } from '../lib/topics'

export const SUBJECT_ICON: Record<SubjectKey, LucideIcon> = {
  maths: Sigma,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Leaf,
  geography: Globe,
  agric: Sprout,
}

// Each subject's own colour and tint, from the Study Desk tokens in desk.css.
export const subjectVars = (key: SubjectKey) =>
  ({ '--c': `var(--${key})`, '--t': `var(--${key}-t)` }) as CSSProperties
