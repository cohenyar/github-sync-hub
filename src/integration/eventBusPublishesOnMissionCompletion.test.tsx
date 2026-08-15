// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { gameEventBus } from '../events'
import type { GameEvent } from '../events'
import { he } from '../i18n'
import { renderGameApp, submitMultipleChoiceAnswer } from '../test/renderGameApp'

// SQL-removal pass — every real mission is now a question mission with no
// async "mission database" step, so there's no "wait until Run is enabled"
// step left to poll for; only the World Scene -> classic dashboard switch
// (unchanged) is still needed before the question panel is on screen.
function switchToClassicDashboard() {
  if (screen.queryByTestId('world-scene-3d')) {
    fireEvent.click(screen.getByTestId('settings-menu-button'))
    fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
  }
}

// gameEventBus is a shared singleton; unsubscribe every spy after each test
// so events published by one test can't leak into the next.
const activeHandlers: Array<(event: GameEvent) => void> = []
function watch(): GameEvent[] {
  const events: GameEvent[] = []
  const handler = (event: GameEvent) => events.push(event)
  for (const type of [
    'MissionStarted',
    'MissionCompleted',
    'WorldStateChanged',
    'CampaignCompleted',
    'ContentUnlocked',
  ] as const) {
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

describe('The event bus publishes real gameplay events end to end', () => {
  it('publishes MissionStarted once a newly active mission is reached', async () => {
    const events = watch()
    renderGameApp()
    switchToClassicDashboard()

    // A question mission has no async "mission database" step, so First
    // Contact — the very first mission of a fresh game — is already active
    // the instant GameApp mounts. That leaves no observable "loading ->
    // active" transition to publish an initial MissionStarted from (see
    // GameApp.tsx's previousPhaseRef effect, which fires only on a real
    // transition; the old SQL runtime always had one, since its database
    // setup was genuinely async). That transition is still real and
    // observable once First Contact completes and the player advances to
    // District Ties, so exercise it there instead.
    submitMultipleChoiceAnswer(0)
    await screen.findByText(he.exerciseCorrectFeedback)

    await waitFor(() => {
      expect(screen.getByTestId('mission-option-district-ties')).toBeEnabled()
    })
    fireEvent.click(screen.getByTestId('mission-option-district-ties'))

    await waitFor(() => {
      const started = events.filter((e) => e.type === 'MissionStarted')
      expect(started).toEqual([{ type: 'MissionStarted', missionId: 'district-ties' }])
    })
  })

  it('publishes WorldStateChanged, MissionCompleted, and ContentUnlocked (but not CampaignCompleted) when only the first of two missions passes', async () => {
    const events = watch()
    renderGameApp()
    switchToClassicDashboard()

    // First Contact is now "The First Emperor" (History, multiple choice) —
    // option 0 (אוגוסטוס) is the correct answer (see missions/firstContact.ts).
    submitMultipleChoiceAnswer(0)

    await screen.findByText(he.exerciseCorrectFeedback)

    // ContentUnlocked is published from a useEffect keyed off playerProgress
    // (Step 21), so it can land on a later tick than the synchronous
    // WorldStateChanged/MissionCompleted pair. Meridian 2.0 open-world pass —
    // District Ties (English) is always unlocked from the very start now,
    // so it never transitions here; completing First Contact instead
    // unlocks History's OWN second mission (full-signal) and the
    // east-broker NPC, so two ContentUnlocked events fire.
    await waitFor(() => {
      const relevant = events.filter((e) => e.type !== 'MissionStarted')
      expect(relevant.map((e) => e.type)).toEqual([
        'WorldStateChanged',
        'MissionCompleted',
        'ContentUnlocked',
        'ContentUnlocked',
      ])
    })

    const relevant = events.filter((e) => e.type !== 'MissionStarted')
    expect(relevant[1]).toEqual({ type: 'MissionCompleted', missionId: 'first-contact' })
    expect(relevant[2]).toEqual({
      type: 'ContentUnlocked',
      target: { type: 'mission', id: 'full-signal' },
    })
    expect(relevant[3]).toEqual({
      type: 'ContentUnlocked',
      target: { type: 'npc', id: 'east-broker' },
    })

    // The campaign has a second mission now, so completing only the first
    // must not fire CampaignCompleted.
    expect(events.some((e) => e.type === 'CampaignCompleted')).toBe(false)

    // Progression still updates via the event bus instead of a direct call —
    // same observable outcome as before the event system existed.
    expect(screen.getByText(`${he.contentLabelPrefix}${he.completed}`)).toBeInTheDocument()
  })

  it('does not publish MissionCompleted, CampaignCompleted, WorldStateChanged, or ContentUnlocked for a wrong answer', async () => {
    const events = watch()
    renderGameApp()
    switchToClassicDashboard()

    // Option 1 (נירון) is a distractor, not the correct answer — the
    // question-mission counterpart to the old failing SQL query. A wrong
    // question-mission answer has no QueryFailed-equivalent event (see
    // useQuestionMission's onFailure in GameApp.tsx: it only plays a failure
    // sound, since that event's sqlErrorKind classification was SQL-only),
    // so there's nothing SQL-specific left to assert here beyond "none of
    // the success-path events fire below."
    submitMultipleChoiceAnswer(1)

    // The exact feedback copy depends on difficultyLevel (Easy/Medium/Hard
    // each phrase a wrong answer differently — see QuestionAnswerPanel), so
    // assert on the difficulty-agnostic data-verdict flag rather than a
    // specific string.
    await waitFor(() => {
      expect(screen.getByTestId('question-feedback')).toHaveAttribute('data-verdict', 'fail')
    })

    expect(events.some((e) => e.type === 'MissionCompleted')).toBe(false)
    expect(events.some((e) => e.type === 'CampaignCompleted')).toBe(false)
    expect(events.some((e) => e.type === 'WorldStateChanged')).toBe(false)
    expect(events.some((e) => e.type === 'ContentUnlocked')).toBe(false)
  })
})
