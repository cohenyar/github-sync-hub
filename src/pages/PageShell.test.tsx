// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { PageShell } from './PageShell'

function renderShell() {
  return render(
    <MemoryRouter>
      <PageShell>
        <p>content</p>
      </PageShell>
    </MemoryRouter>,
  )
}

describe('PageShell', () => {
  it('links only to the routes that render real content', () => {
    renderShell()
    const nav = screen.getByRole('navigation')
    const links = nav.querySelectorAll('a')
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/', '/dashboard', '/world'])
  })

  it('does not link to the hidden placeholder pages', () => {
    renderShell()
    const nav = screen.getByRole('navigation')
    for (const label of [he.navCoursesLabel, he.navTutorLabel, he.navProgressLabel, he.navProfileLabel]) {
      expect(nav.textContent).not.toContain(label)
    }
  })
})
