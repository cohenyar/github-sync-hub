// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { gameEventBus } from '../events'
import type { GameEvent } from '../events'
import { he } from '../i18n'
import { renderGameApp, submitMultipleChoiceAnswer, submitShortTextAnswer } from '../test/renderGameApp'

// SQL-removal pass — every real mission is now a question mission with no
// async database step, so there's nothing left to wait "ready" for; only
// the World Scene -> classic dashboard switch (unchanged) is still needed.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

async function switchToMission(title: string, status: 'available' | 'completed') {
  const label = status === 'available' ? he.available : he.completed
  fireEvent.click(screen.getByRole('button', { name: `${title} (${label})` }))
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
    renderGameApp()
    switchToClassicDashboard()

    // 1. First Contact / "הקיסר הראשון" (History, MC — 1/6 ≈ 17%)
    submitMultipleChoiceAnswer(0) // אוגוסטוס
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}17%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `תרגום: ספרייה (${he.available})` })).toBeInTheDocument()

    // 2. District Ties / "תרגום: ספרייה" (English, MC — 2/6 ≈ 33%)
    // The 40%-progression-gated NPC is not visible yet — 33% is still below it.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    await switchToMission('תרגום: ספרייה', 'available')
    submitMultipleChoiceAnswer(0) // Library
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}33%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `כפל: 8 × 7 (${he.available})` })).toBeInTheDocument()
    expect(document.querySelector('[data-npc-id="north-analyst"]')).toBeNull()

    // 3. South Stability / "כפל: 8 × 7" (Math, short text — 3/6 = 50%)
    await switchToMission('כפל: 8 × 7', 'available')
    submitShortTextAnswer('56')
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}50%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `הנשיא הראשון (${he.available})` })).toBeInTheDocument()
    // The NPC gated behind South Stability is now visible on the map.
    expect(document.querySelector('[data-npc-id="south-engineer"]')).not.toBeNull()
    // 50% crosses the 40% progression threshold — north-analyst unlocks here, not at District Ties.
    expect(document.querySelector('[data-npc-id="north-analyst"]')).not.toBeNull()

    // 4. Full Signal / "הנשיא הראשון" (History, MC — 4/6 ≈ 67%)
    await switchToMission('הנשיא הראשון', 'available')
    submitMultipleChoiceAnswer(0) // ג'ורג' וושינגטון
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}67%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `תרגום: ספר (${he.available})` })).toBeInTheDocument()
    expect(screen.queryByText(he.campaignCompleteTitle)).not.toBeInTheDocument()

    // 5. Linked Records / "תרגום: ספר" (English, short text — 5/6 ≈ 83%) — no longer the finale.
    await switchToMission('תרגום: ספר', 'available')
    submitShortTextAnswer('book')
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}83%`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `כפל: 12 × 5 (${he.available})` })).toBeInTheDocument()
    expect(screen.queryByText(he.campaignCompleteTitle)).not.toBeInTheDocument()

    // 6. Priority Signal / "כפל: 12 × 5" (Math, MC — 6/6 = 100%) — the true finale.
    await switchToMission('כפל: 12 × 5', 'available')
    submitMultipleChoiceAnswer(0) // 60
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.progressLabelPrefix}100%`)).toBeInTheDocument()

    // The campaign-completion-gated NPC is now visible.
    expect(document.querySelector('[data-npc-id="city-voice"]')).not.toBeNull()

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
    // narration (order doesn't matter here — just that both fired). These
    // are world/campaign-state flavor text, unrelated to mission content, so
    // they're unaffected by the SQL-removal content change.
    expect(
      screen.getByText('הקול הדחוף ביותר עולה לראש. מרידיאן יודעת סוף־סוף במה לטפל קודם.'),
    ).toBeInTheDocument()
    expect(screen.getByText('כל החוטים התחברו. מרידיאן עונה כעת כעיר אחת.')).toBeInTheDocument()

    // The distinct campaign-completion visual moment (Sprint 1 polish).
    expect(screen.getByText(he.campaignCompleteTitle)).toBeInTheDocument()
  })
})
