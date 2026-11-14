import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Crashed, NotFound } from './__root'

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('friendly error pages', () => {
  it('page not found offers the way back and every subject', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'That page isn’t here',
    )
    expect(
      screen.getByRole('link', { name: 'Go to your subjects' }),
    ).toHaveAttribute('href', '/app')
    expect(
      screen
        .getByRole('navigation', { name: 'Subjects' })
        .querySelectorAll('a'),
    ).toHaveLength(6)
  })

  it('a crash apologises, hides the technical detail and retries', () => {
    const reset = vi.fn()
    render(<Crashed error={new Error('boom: stack detail')} reset={reset} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'It’s us, not you',
    )
    expect(screen.queryByText(/boom/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalled()
  })

  it('says so when the device is offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    render(<Crashed error={new Error('x')} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'You’re offline',
    )
  })
})
