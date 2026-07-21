// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { QueryResultTable } from './QueryResultTable'

describe('QueryResultTable', () => {
  it('renders a message when there are no rows', () => {
    render(<QueryResultTable rows={[]} />)
    expect(screen.getByText(he.noRowsReturned)).toBeInTheDocument()
  })

  it('renders a header for each column and a row for each record', () => {
    render(
      <QueryResultTable
        rows={[
          { id: 1, name: 'Iris Vell' },
          { id: 2, name: 'Bram Osei' },
        ]}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'id' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'name' })).toBeInTheDocument()
    expect(screen.getByText('Iris Vell')).toBeInTheDocument()
    expect(screen.getByText('Bram Osei')).toBeInTheDocument()
  })
})
