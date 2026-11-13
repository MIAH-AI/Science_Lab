import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route } from './index'

const Home = Route.options.component!

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
})
afterEach(() => vi.useRealTimers())

const cards = () =>
  screen
    .getAllByRole('article')
    .map((a) => within(a).getByRole('heading').textContent)

describe('home page', () => {
  it('shows all six subjects with lab and practice links', () => {
    render(<Home />)
    expect(cards()).toEqual([
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Geography',
      'Agricultural Science',
    ])
    const bio = screen.getAllByRole('article')[3]
    expect(within(bio).getByRole('link', { name: 'Open lab' })).toHaveAttribute(
      'href',
      '/waec-biology-lab?appearance=default',
    )
    expect(within(bio).getByRole('link', { name: 'Practise' })).toHaveAttribute(
      'href',
      '/waec-biology-lab?appearance=default#exam',
    )
  })

  it('searches topics and can be cleared', () => {
    render(<Home />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search topics' }), {
      target: { value: 'titration' },
    })
    expect(cards()).toEqual(['Chemistry'])
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'qqqq' },
    })
    expect(screen.getByText('No topics found')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show all subjects' }))
    expect(cards()).toHaveLength(6)
  })

  it('switches to Night and passes it to the labs', () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: 'Night' }))
    expect(screen.getByRole('button', { name: 'Night' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getAllByRole('link', { name: 'Open lab' })[0].getAttribute('href'),
    ).toContain('appearance=night')
  })

  it('runs, pauses and resets the focus timer', () => {
    vi.useFakeTimers()
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: '15 min' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start a session' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByRole('timer')).toHaveTextContent('14:57')
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByRole('timer')).toHaveTextContent('14:57')
    fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }))
    expect(screen.getByRole('timer')).toHaveTextContent('15:00')
  })
})
