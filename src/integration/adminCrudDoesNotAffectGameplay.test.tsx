// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminPanel } from '../admin'
import GameApp from '../GameApp'
import { he } from '../i18n'
import { getDefaultMission, removeMission } from '../missions'
import { markOnboardingComplete } from '../onboarding'
import { createInitialPlayerProgress } from '../progression'
import { getUnlockedNpcIds } from '../unlocks'

vi.mock('../db/database', async () => {
  const { createTestDatabase } = await import('../verifier/testDb')
  return { createDatabase: createTestDatabase }
})

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
// classic dashboard's Mission/SQL console and Admin's live registries.
function renderGameWithAdmin() {
  markOnboardingComplete()
  render(
    <>
      <GameApp />
      <AdminPanel />
    </>,
  )
  fireEvent.click(screen.getByTestId('toggle-world-scene-button'))
}

async function readyRunButton() {
  const runButton = await screen.findByRole('button', { name: he.run })
  await waitFor(() => expect(runButton).toBeEnabled())
  return runButton
}

function fillMissionForm() {
  fireEvent.change(screen.getByLabelText('Mission id'), { target: { value: TEST_MISSION_ID } })
  fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'Admin Mission' } })
  fireEvent.change(screen.getByLabelText('Mission goal'), { target: { value: 'Goal' } })
  fireEvent.change(screen.getByLabelText('Mission prompt'), { target: { value: 'Prompt' } })
  fireEvent.change(screen.getByLabelText('Mission setup SQL'), { target: { value: 'CREATE TABLE t (id INTEGER);' } })
  fireEvent.change(screen.getByLabelText('Mission reference SQL'), { target: { value: 'SELECT * FROM t;' } })
}

// Auth Phase 1: Admin moved from an in-game toggle to its own protected
// /admin route (see src/auth/ProtectedAdminRoute.tsx), so it's no longer
// reachable from inside a rendered <GameApp/> tree. Admin's mutations write
// straight to the shared mission/NPC registries (no props, no store), so
// rendering <GameApp/> and <AdminPanel/> side by side in the same test
// reproduces exactly what the old toggle did — both trees observe the same
// underlying registry — without needing a route or an admin session.
describe('Admin CRUD does not affect live gameplay', () => {
  it('adding a mission through Admin leaves the active mission and SQL console untouched', async () => {
    renderGameWithAdmin()
    await readyRunButton()

    const missionBeforeAdmin = getDefaultMission().id
    expect(screen.getByRole('heading', { name: 'מגע ראשון' })).toBeInTheDocument()

    fillMissionForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add Mission' }))

    // The new mission shows up in Admin...
    expect(screen.getByText('Admin Mission')).toBeInTheDocument()
    // ...but the live SQL console/Mission panel are unaffected.
    expect(getDefaultMission().id).toBe(missionBeforeAdmin)
    expect(screen.getByRole('heading', { name: 'מגע ראשון' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(he.sqlPlaceholder), {
      target: { value: 'SELECT * FROM citizens;' },
    })
    fireEvent.click(screen.getByRole('button', { name: he.run }))
    await screen.findByText(he.pass)
    expect(screen.getByText(`${he.nextLabelPrefix}קשרי מחוז (${he.available})`)).toBeInTheDocument()
  })

  it('adding an NPC through Admin does not change the unlock status of existing NPCs', async () => {
    renderGameWithAdmin()
    await readyRunButton()

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
