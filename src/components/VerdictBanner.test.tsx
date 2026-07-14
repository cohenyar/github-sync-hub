// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Verdict } from '../verifier'
import { VerdictBanner } from './VerdictBanner'

function verdict(overrides: Partial<Verdict> = {}): Verdict {
  return { pass: false, missing: [], extra: [], orderWrong: false, expected: [], actual: [], ...overrides }
}

describe('VerdictBanner', () => {
  it('shows Pass for a passing verdict', () => {
    render(<VerdictBanner verdict={verdict({ pass: true })} />)
    expect(screen.getByText('Pass')).toBeInTheDocument()
  })

  it('shows Fail for a failing verdict', () => {
    render(<VerdictBanner verdict={verdict()} />)
    expect(screen.getByText('Fail')).toBeInTheDocument()
  })

  it('shows no hint for a passing verdict', () => {
    render(<VerdictBanner verdict={verdict({ pass: true })} />)
    expect(screen.queryByText(/Expected/)).not.toBeInTheDocument()
  })

  it('shows no hint when a failing verdict has no missing or extra rows (e.g. orderWrong only)', () => {
    render(<VerdictBanner verdict={verdict({ orderWrong: true })} />)
    expect(screen.queryByText(/Expected/)).not.toBeInTheDocument()
  })

  it('hints that the filter may be too narrow when rows are missing', () => {
    const v = verdict({
      missing: [{ id: 2 }, { id: 3 }, { id: 4 }],
      expected: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      actual: [{ id: 1 }],
    })
    render(<VerdictBanner verdict={v} />)
    expect(screen.getByText('Expected 4 rows, got 1. Missing 3 rows — your filter may be too narrow.')).toBeInTheDocument()
  })

  it('hints that the filter may be too broad when there are unexpected rows', () => {
    const v = verdict({
      extra: [{ id: 5 }],
      expected: [{ id: 1 }],
      actual: [{ id: 1 }, { id: 5 }],
    })
    render(<VerdictBanner verdict={v} />)
    expect(
      screen.getByText('Expected 1 row, got 2. 1 unexpected row — your filter may be too broad.'),
    ).toBeInTheDocument()
  })

  it('hints to check filter conditions when rows are both missing and unexpected', () => {
    const v = verdict({
      missing: [{ id: 2 }],
      extra: [{ id: 9 }],
      expected: [{ id: 1 }, { id: 2 }],
      actual: [{ id: 1 }, { id: 9 }],
    })
    render(<VerdictBanner verdict={v} />)
    expect(
      screen.getByText('Expected 2 rows, got 2. Missing 1, 1 unexpected — check your filter conditions.'),
    ).toBeInTheDocument()
  })
})
