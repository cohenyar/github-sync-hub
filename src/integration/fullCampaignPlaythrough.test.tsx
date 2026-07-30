// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GameApp from '../GameApp'
import { gameEventBus } from '../events'
import type { GameEvent } from '../events'
import { he } from '../i18n'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

async function readyRunButton() {
  // The World Scene (not the classic dashboard) is now the default view —
  // switch to the classic dashboard first if we're not there already.
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

function runQuery(sql: string) {
  fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), { target: { value: sql } })
  fireEvent.click(screen.getByRole('button', { name: he.run }))
}

async function switchToMission(title: string, status: 'available' | 'completed') {
  const label = status === 'available' ? he.available : he.completed
  fireEvent.click(screen.getByRole('button', { name: `${title} (${label})` }))
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
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}17%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `קשרי מחוז (${he.available})` })).toBeInTheDocument()

    // 2. District Ties (2/6 ≈ 33%)
    // The 40%-progression-gated NPC is not visible yet — 33% is still below it.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    await switchToMission('קשרי מחוז', 'available')
    runQuery("SELECT * FROM citizens WHERE district = 'north';")
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}33%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `יציבות הדרום (${he.available})` })).toBeInTheDocument()
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    // 3. South Stability (3/6 = 50%)
    await switchToMission('יציבות הדרום', 'available')
    runQuery("SELECT * FROM district_reports WHERE district = 'south' AND severity >= 3;")
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}50%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `אות מלא (${he.available})` })).toBeInTheDocument()
    // The NPC gated behind South Stability is now visible on the map.
    expect(document.querySelector('[data-npc-id="south-engineer"]')).not.toBeNull()
    // 50% crosses the 40% progression threshold — north-analyst unlocks here, not at District Ties.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).not.toBeNull()

    // 4. Full Signal (4/6 ≈ 67%)
    await switchToMission('אות מלא', 'available')
    runQuery('SELECT district, COUNT(*) AS total FROM citizens GROUP BY district;')
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}67%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `רשומות מקושרות (${he.available})` })).toBeInTheDocument()
    expect(screen.queryByText(he.campaignCompleteTitle)).not.toBeInTheDocument()

    // 5. Linked Records (5/6 ≈ 83%) — no longer the finale.
    await switchToMission('רשומות מקושרות', 'available')
    runQuery(
      'SELECT citizens.name, district_officials.official ' +
        'FROM citizens JOIN district_officials ON citizens.district = district_officials.district;',
    )
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}83%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `אות בעדיפות (${he.available})` })).toBeInTheDocument()
    expect(screen.queryByText(he.campaignCompleteTitle)).not.toBeInTheDocument()

    // 6. Priority Signal (6/6 = 100%) — the true finale, introducing ORDER BY.
    await switchToMission('אות בעדיפות', 'available')
    runQuery('SELECT * FROM signal_reports ORDER BY severity DESC;')
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.progressLabelPrefix}100%`)).toBeInTheDocument()

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
      screen.getByText('הקול הדחוף ביותר עולה לראש. מרידיאן יודעת סוף־סוף במה לטפל קודם.'),
    ).toBeInTheDocument()
    expect(screen.getByText('כל החוטים התחברו. מרידיאן עונה כעת כעיר אחת.')).toBeInTheDocument()

    // The distinct campaign-completion visual moment (Sprint 1 polish).
    expect(screen.getByText(he.campaignCompleteTitle)).toBeInTheDocument()
  })
})
