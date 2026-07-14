// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OdinNarrationEntry } from '../types'
import { OdinPanel } from './OdinPanel'

function entry(id: string, message: string, sequence: number): OdinNarrationEntry {
  return { id, message, sequence, event: { type: 'MissionStarted', missionId: 'x' } }
}

describe('OdinPanel', () => {
  it('always shows the deterministic/offline status', () => {
    render(<OdinPanel latestMessage={null} history={[]} />)
    expect(screen.getByText('Status: Deterministic / Offline')).toBeInTheDocument()
  })

  it('shows a placeholder when there is no message yet', () => {
    render(<OdinPanel latestMessage={null} history={[]} />)
    expect(screen.getByText('Odin is listening. Nothing to report yet.')).toBeInTheDocument()
  })

  it('shows the latest message', () => {
    render(<OdinPanel latestMessage="The signal is steady now." history={[entry('a', 'The signal is steady now.', 1)]} />)
    expect(screen.getByText('The signal is steady now.')).toBeInTheDocument()
  })

  it('renders no history list when there is only the latest entry', () => {
    render(<OdinPanel latestMessage="first" history={[entry('a', 'first', 1)]} />)
    expect(screen.queryByRole('list', { name: 'Odin narration history' })).not.toBeInTheDocument()
  })

  it('renders prior entries in the history list, most recent first, without repeating the latest', () => {
    const history = [entry('a', 'first', 1), entry('b', 'second', 2), entry('c', 'third', 3)]
    render(<OdinPanel latestMessage="third" history={history} />)

    const list = screen.getByRole('list', { name: 'Odin narration history' })
    const items = list.querySelectorAll('li')
    expect(Array.from(items).map((li) => li.textContent)).toEqual(['second', 'first'])
  })

  it('shows only the most recent 4 prior entries', () => {
    const history = Array.from({ length: 6 }, (_, i) => entry(`e${i}`, `message ${i}`, i + 1))
    render(<OdinPanel latestMessage="message 5" history={history} />)

    const list = screen.getByRole('list', { name: 'Odin narration history' })
    expect(list.querySelectorAll('li')).toHaveLength(4)
  })
})
