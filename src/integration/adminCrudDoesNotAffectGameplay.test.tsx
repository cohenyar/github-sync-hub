// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AdminPanel } from '../admin'
import GameApp from '../GameApp'
import { he } from '../i18n'
import { addMission, getDefaultMission, removeMission } from '../missions'
import { markOnboardingComplete } from '../onboarding'
import { createInitialPlayerProgress } from '../progression'
import { passEntryGates, submitMultipleChoiceAnswer } from '../test/renderGameApp'
import { getUnlockedNpcIds } from '../unlocks'

const TEST_MISSION_ID = 'integration-test-mission'
const TEST_NPC_ID = 'integration-test-npc'

afterEach(() => {
  try {
    removeMission(TEST_MISSION_ID)
  } catch {
    // not present; nothing to clean up
  }
})

// Onboarding: pre-seeds the flag (as a returning player would have it) and
// switches to the classic dashboard via the existing toggle — the World
// Scene is the new default view, but this suite is specifically about the
// classic dashboard's Mission panel and Admin's live registries.
function renderGameWithAdmin() {
  markOnboardingComplete()
  render(
    <>
      <GameApp />
      <AdminPanel />
    </>,
  )
  passEntryGates()
  fireEvent.click(screen.getByTestId('settings-menu-button'))
  fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
}

// Auth Phase 1: Admin moved from an in-game toggle to its own protected
// /admin route (see src/auth/ProtectedAdminRoute.tsx), so it's no longer
// reachable from inside a rendered <GameApp/> tree. Admin's mutations write
// straight to the shared mission/NPC registries (no props, no store), so
// rendering <GameApp/> and <AdminPanel/> side by side in the same test
// reproduces exactly what the old toggle did — both trees observe the same
// underlying registry — without needing a route or an admin session.
describe('Admin CRUD does not affect live gameplay', () => {
  // General educational assistant pass — the legacy admin Missions CRUD
  // form (MissionsAdminSection) authored only SQL missions and has been
  // removed along with SQL as a learning subject; the real Admin CMS is
  // the sanctioned authoring path now, and the hardcoded registry stays
  // mutable directly (addMission) for exactly the reason it always was:
  // this invariant (a registry mutation elsewhere never disturbs the
  // mission already active in a running game) must still hold regardless
  // of what mutates the registry.
  it('a mission added directly to the registry leaves the active mission and question panel untouched', async () => {
    renderGameWithAdmin()

    const missionBeforeAdmin = getDefaultMission().id
    expect(screen.getByRole('heading', { name: 'הקיסר הראשון' })).toBeInTheDocument()

    addMission({
      id: TEST_MISSION_ID,
      title: 'Admin Mission',
      goal: 'Goal',
      prompt: 'Prompt',
      subjectHe: 'מתמטיקה',
      taskHe: 'שאלה לדוגמה?',
      answerConfig: { type: 'exact_text', acceptedAnswers: ['תשובה'] },
    })

    // The live Mission panel/question console are unaffected.
    expect(getDefaultMission().id).toBe(missionBeforeAdmin)
    expect(screen.getByRole('heading', { name: 'הקיסר הראשון' })).toBeInTheDocument()

    // SQL-removal pass — First Contact is now "הקיסר הראשון" (The First
    // Emperor), a History multiple-choice question; option 0 (אוגוסטוס) is
    // the correct answer (see missions/firstContact.ts). District Ties'
    // own title also changed, from "קשרי מחוז" to "תרגום: ספרייה" (see
    // missions/districtTies.ts).
    submitMultipleChoiceAnswer(0)
    await screen.findByText(he.exerciseCorrectFeedback)
    expect(screen.getByText(`${he.nextLabelPrefix}תרגום: ספרייה (${he.available})`)).toBeInTheDocument()
  })

  it('adding an NPC through Admin does not change the unlock status of existing NPCs', () => {
    renderGameWithAdmin()

    const progress = createInitialPlayerProgress()
    const unlockedBefore = getUnlockedNpcIds(progress)

    fireEvent.change(screen.getByLabelText('NPC id'), { target: { value: TEST_NPC_ID } })
    fireEvent.change(screen.getByLabelText('NPC name'), { target: { value: 'Integration Test NPC' } })
    fireEvent.change(screen.getByLabelText('NPC district'), { target: { value: 'north' } })
    fireEvent.change(screen.getByLabelText('NPC role'), { target: { value: 'Tester' } })
    fireEvent.change(screen.getByLabelText('NPC description'), { target: { value: 'Temp.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add NPC' }))

    expect(screen.getByText('Integration Test NPC')).toBeInTheDocument()

    // Existing NPCs keep exactly the same unlock status as before.
    const unlockedAfter = getUnlockedNpcIds(progress)
    expect(unlockedAfter).toEqual(unlockedBefore)

    // The new NPC has no rule in this session's (unchanged) Unlock Engine
    // snapshot, so it is locked by default and never renders on the map.
    expect(unlockedAfter).not.toContain(TEST_NPC_ID)
    expect(document.querySelector(`[data-npc-id="${TEST_NPC_ID}"]`)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Integration Test NPC' }))
  })
})
