// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import type { Verdict } from '../verifier'
import { VerdictBanner } from './VerdictBanner'

function verdict(overrides: Partial<Verdict> = {}): Verdict {
  return { pass: false, missing: [], extra: [], orderWrong: false, expected: [], actual: [], ...overrides }
}

describe('VerdictBanner', () => {
  it('shows Pass for a passing verdict', () => {
    render(<VerdictBanner verdict={verdict({ pass: true })} />)
    expect(screen.getByText(he.pass)).toBeInTheDocument()
  })

  it('shows Fail for a failing verdict', () => {
    render(<VerdictBanner verdict={verdict()} />)
    expect(screen.getByText(he.fail)).toBeInTheDocument()
  })

  it('shows no hint for a passing verdict', () => {
    render(<VerdictBanner verdict={verdict({ pass: true })} />)
    expect(screen.queryByText(/ציפינו/)).not.toBeInTheDocument()
  })

  it('shows no hint when a failing verdict has no missing or extra rows (e.g. orderWrong only)', () => {
    render(<VerdictBanner verdict={verdict({ orderWrong: true })} />)
    expect(screen.queryByText(/ציפינו/)).not.toBeInTheDocument()
  })

  it('hints that the filter may be too narrow when rows are missing', () => {
    const v = verdict({
      missing: [{ id: 2 }, { id: 3 }, { id: 4 }],
      expected: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      actual: [{ id: 1 }],
    })
    render(<VerdictBanner verdict={v} />)
    expect(
      screen.getByText('ציפינו ל-4 שורות, התקבלו 1. חסרות 3 שורות — ייתכן שהתנאי מצומצם מדי.'),
    ).toBeInTheDocument()
  })

  it('hints that the filter may be too broad when there are unexpected rows', () => {
    const v = verdict({
      extra: [{ id: 5 }],
      expected: [{ id: 1 }],
      actual: [{ id: 1 }, { id: 5 }],
    })
    render(<VerdictBanner verdict={v} />)
    expect(
      screen.getByText('ציפינו ל-1 שורות, התקבלו 2. 1 שורות מיותרות — ייתכן שהתנאי רחב מדי.'),
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
      screen.getByText('ציפינו ל-2 שורות, התקבלו 2. חסרות 1, 1 מיותרות — בדוק/י את תנאי הסינון.'),
    ).toBeInTheDocument()
  })

  describe('First Mission UX pass — difficulty-gated feedback specificity', () => {
    const missingOnly = verdict({
      missing: [{ id: 2 }, { id: 3 }, { id: 4 }],
      expected: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      actual: [{ id: 1 }],
    })

    it('Easy adds an encouraging line to the normal (Medium) count-based guidance', () => {
      render(<VerdictBanner verdict={missingOnly} difficultyLevel={1} />)
      expect(
        screen.getByText(
          'ציפינו ל-4 שורות, התקבלו 1. חסרות 3 שורות — ייתכן שהתנאי מצומצם מדי. אפשר לנסות שוב — כל ניסיון מקרב אותך לתשובה.',
        ),
      ).toBeInTheDocument()
    })

    it('Medium (an explicit 2) matches the default, count-based guidance exactly', () => {
      render(<VerdictBanner verdict={missingOnly} difficultyLevel={2} />)
      expect(
        screen.getByText('ציפינו ל-4 שורות, התקבלו 1. חסרות 3 שורות — ייתכן שהתנאי מצומצם מדי.'),
      ).toBeInTheDocument()
    })

    it('Hard identifies the mistake type only, without exact row counts', () => {
      render(<VerdictBanner verdict={missingOnly} difficultyLevel={3} />)
      expect(screen.queryByText(/ציפינו/)).not.toBeInTheDocument()
      expect(screen.queryByText(/\d/)).not.toBeInTheDocument()
      expect(screen.getByText('התוצאה חלקית — ייתכן שהתנאי מצומצם מדי.')).toBeInTheDocument()
    })

    it('Hard identifies a too-broad result the same way, without exact counts', () => {
      const extraOnly = verdict({ extra: [{ id: 5 }], expected: [{ id: 1 }], actual: [{ id: 1 }, { id: 5 }] })
      render(<VerdictBanner verdict={extraOnly} difficultyLevel={3} />)
      expect(screen.getByText('התוצאה רחבה מדי — ייתכן שהתנאי רחב מדי.')).toBeInTheDocument()
    })
  })
})
