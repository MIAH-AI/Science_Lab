import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Marketing } from './Marketing'
import { DEFAULT_DESIGN, roles, subjects, toDesign } from './content'

describe('site setting for the front page design', () => {
  it('defaults to C and ignores anything that is not a, b or c', () => {
    expect(DEFAULT_DESIGN).toBe('c')
    expect(toDesign(undefined)).toBe('c')
    expect(toDesign('')).toBe('c')
    expect(toDesign('z')).toBe('c')
    expect(toDesign(' B ')).toBe('b')
    expect(toDesign('a')).toBe('a')
  })
})

describe.each(['a', 'b', 'c'] as const)('front page design %s', (design) => {
  it('has one main heading, every subject, every demo role and the small print', () => {
    const { container } = render(<Marketing design={design} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    for (const s of subjects)
      expect(
        container.querySelector(`a[href="${s.path}"]`),
        s.name,
      ).not.toBeNull()
    if (design === 'b') {
      // B shows one role at a time
      for (const r of roles) {
        fireEvent.click(screen.getByRole('button', { name: r.name }))
        expect(
          screen.getByRole('link', { name: `Open the demo as ${r.name}` }),
        ).toHaveAttribute('href', r.path)
      }
    } else
      for (const r of roles)
        expect(container.querySelector(`a[href="${r.path}"]`)).not.toBeNull()
    expect(
      screen.getAllByRole('link', { name: 'Try the demo' })[0],
    ).toHaveAttribute('href', '/demo')
    expect(screen.getByText(/not affiliated with WAEC/)).toBeInTheDocument()
    // The pitch is not tied to one exam board: WAEC appears only in the small print.
    const pitch = container.cloneNode(true) as HTMLElement
    pitch.querySelector('footer')?.remove()
    expect(pitch.textContent).not.toMatch(/WAEC/)
  })
})

describe('design C search', () => {
  it('finds a topic in the right subject and links to its lab', () => {
    render(<Marketing design="c" />)
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search every subject for a topic',
      }),
      { target: { value: 'titration' } },
    )
    const hit = screen.getByRole('link', { name: /Chemistry.*Open lab/ })
    expect(hit).toHaveAttribute('href', '/chemistry-simulations')
    expect(within(hit).getByText(/titration/i)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'qqqq' },
    })
    expect(screen.getByText('Nothing matches “qqqq”')).toBeInTheDocument()
  })
})

describe('design B comparison', () => {
  it('switches the example topic', () => {
    render(<Marketing design="b" />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Skeleton and muscles' }),
    )
    expect(screen.getByText(/skull and bone histology/)).toBeInTheDocument()
  })
})
