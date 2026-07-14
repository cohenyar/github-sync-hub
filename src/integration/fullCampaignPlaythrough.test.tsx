// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { gameEventBus } from '../events'
import type { GameEvent } from '../events'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: 'Run' })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

function runQuery(sql: string) {
  fireEvent.change(screen.getByPlaceholderText('-- write your query here'), { target: { value: sql } })
  fireEvent.click(screen.getByRole('button', { name: 'Run' }))
}

async function switchToMission(title: string, status: 'Available' | 'Completed') {
  fireEvent.click(screen.getByRole('button', { name: `${title} (${status})` }))
  await readyRunButton()
}

const activeHandlers: Array<(event: GameEvent) => void> = []
function watch(): GameEvent[] {
  const events: GameEvent[] = []
  const handler = (event: GameEvent) => events.push(event)
  for (const type of ['MissionCompleted', 'CampaignCompleted', 'ContentUnlocked'] as const) {
    gameEventBus.subscribe(type, handler)
  }
  activeHandlers.push(handler)
  return events
}

afterEach(() => {
  for (const handler of activeHandlers.splice(0)) {
    gameEventBus.unsubscribe(handler)
  }
})

describe('Full campaign playthrough: all six missions in order, switching between them', () => {
  it('unlocks every mission and NPC in the chain and completes the campaign exactly once', async () => {
    const events = watch()
    render(<GameApp />)
    await readyRunButton()

    // 1. First Contact (1/6 ≈ 17%)
    runQuery('SELECT * FROM citizens;')
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 17%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'District Ties (Available)' })).toBeInTheDocument()

    // 2. District Ties (2/6 ≈ 33%)
    // The 40%-progression-gated NPC is not visible yet — 33% is still below it.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    await switchToMission('District Ties', 'Available')
    runQuery("SELECT * FROM citizens WHERE district = 'north';")
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 33%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'South Stability (Available)' })).toBeInTheDocument()
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    // 3. South Stability (3/6 = 50%)
    await switchToMission('South Stability', 'Available')
    runQuery("SELECT * FROM district_reports WHERE district = 'south' AND severity >= 3;")
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 50%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Full Signal (Available)' })).toBeInTheDocument()
    // The NPC gated behind South Stability is now visible on the map.
    expect(document.querySelector('[data-npc-id="south-engineer"]')).not.toBeNull()
    // 50% crosses the 40% progression threshold — north-analyst unlocks here, not at District Ties.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).not.toBeNull()

    // 4. Full Signal (4/6 ≈ 67%)
    await switchToMission('Full Signal', 'Available')
    runQuery('SELECT district, COUNT(*) AS total FROM citizens GROUP BY district;')
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 67%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Linked Records (Available)' })).toBeInTheDocument()
    expect(screen.queryByText('Campaign Complete')).not.toBeInTheDocument()

    // 5. Linked Records (5/6 ≈ 83%) — no longer the finale.
    await switchToMission('Linked Records', 'Available')
    runQuery(
      'SELECT citizens.name, district_officials.official ' +
        'FROM citizens JOIN district_officials ON citizens.district = district_officials.district;',
    )
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 83%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Priority Signal (Available)' })).toBeInTheDocument()
    expect(screen.queryByText('Campaign Complete')).not.toBeInTheDocument()

    // 6. Priority Signal (6/6 = 100%) — the true finale, introducing ORDER BY.
    await switchToMission('Priority Signal', 'Available')
    runQuery('SELECT * FROM signal_reports ORDER BY severity DESC;')
    await screen.findByText('Pass')
    expect(screen.getByText('Progress: 100%')).toBeInTheDocument()

    // The campaign-completion-gated NPC is now visible.
    await waitFor(() => expect(document.querySelector('[data-npc-id="city-voice"]')).not.toBeNull())

    // Every mission fired exactly once, and CampaignCompleted fired exactly
    // once, only after the true last mission completed.
    const completedMissionIds = events.filter((e) => e.type === 'MissionCompleted').map((e) => e.missionId)
    expect(completedMissionIds).toEqual([
      'first-contact',
      'district-ties',
      'south-stability',
      'full-signal',
      'linked-records',
      'priority-signal',
    ])
    expect(events.filter((e) => e.type === 'CampaignCompleted')).toHaveLength(1)

    // Odin's dedicated finale/campaign lines both appear somewhere in the
    // narration (order doesn't matter here — just that both fired).
    expect(
      screen.getByText('The most urgent voice rises to the top. Meridian finally knows what to answer first.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Every thread accounted for. Meridian answers as one city now.')).toBeInTheDocument()

    // The distinct campaign-completion visual moment (Sprint 1 polish).
    expect(screen.getByText('Campaign Complete')).toBeInTheDocument()
  })
})
