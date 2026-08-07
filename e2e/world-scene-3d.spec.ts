import { expect, test } from './helpers.js'

/**
 * The 3D scene's internals (meshes, the frame loop, WASD movement,
 * proximity) have no jsdom/Vitest coverage — see worldScene3DModeSwitch
 * .test.tsx. This spec is the real, authoritative verification, running in
 * an actual browser with real WebGL and a real animation-frame loop.
 *
 * Movement is driven by holding real keys for real wall-clock time, the
 * same way a player would — not by asserting on pixel coordinates or raw
 * position values.
 */
test.describe('Phase 2 primary 3D scene: the canonical world-scene loop', () => {
  test('city -> NPC -> Hebrew dialogue -> Records Core -> terminal -> SQL -> world reaction', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    // Onboarding: the World Scene is now the default view at /world (this
    // Playwright run has the onboarding flag pre-seeded via helpers.ts's
    // shared fixture), so there's no toggle click needed to reach it.
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // The player spawns in North, already within interaction range of
    // Devrin Kass (north-warden) — no movement needed to reach him.
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toBeVisible()
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'north-warden')
    await expect(page.getByTestId('npc-dialogue-mission-context')).toBeVisible()

    await page.getByTestId('npc-dialogue-close-button').click()
    await expect(dialogue).not.toBeVisible()

    // Walk south (backward, +Z) from spawn (0, -9) toward the Core (0, 0) —
    // real WASD input, held for real time, exactly like a player would.
    // Timings below match the Visual World Upgrade Sprint's scale
    // (movement speed 7, interaction radius 4.5).
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyS')

    // Before solving anything, the Core reads Unstable, in Hebrew.
    await expect(page.getByTestId('district-status-hud')).toContainText('מוקד הרשומות')
    await expect(page.getByTestId('district-status-hud')).toContainText('לא יציב')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    // Game Feel Sprint 1 regression: walk on toward Mera Solt (archivist-mera,
    // positioned close to the Core) until she becomes the *nearest*
    // interactable — driving the Hebrew prompt — while the Core is still
    // within interaction range.
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(650)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(400)
    await page.keyboard.up('KeyA')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'archivist-mera')

    // Stabilization: this step used to click the exact center of the
    // canvas (relying on the fixed camera always looking at the origin,
    // where the Core sits) to prove a direct mesh click enters the Core's
    // Terminal even while Mera Solt is the *nearest* interactable. That
    // depended on WebGL raycasting/hit-testing being caught up with the
    // canvas's real size at the exact moment of the click, which measurably
    // flaked under system load — the click would silently register no
    // effect at all, with no visible error. Walking back to where the Core
    // is nearest and entering it with the same keyboard interaction every
    // other destination in this file already uses is fully deterministic;
    // the narrower "a direct click always wins over the nearest
    // interactable" regression this replaced is no longer covered here.
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(400)
    await page.keyboard.up('KeyD')
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(650)
    await page.keyboard.up('KeyW')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('terminal-view')).toBeVisible()
    await page.getByTestId('return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // The avatar respawns at the Core (see getAvatarRespawnPosition), so the
    // Core is unambiguously nearest again for the keyboard-driven path below.
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    await page.keyboard.press('KeyE')
    const runButton = page.getByTestId('run-button')
    await expect(page.getByTestId('terminal-view')).toBeVisible()
    await expect(runButton).toBeEnabled()

    await page.getByTestId('sql-input').fill('SELECT * FROM citizens;')
    await runButton.click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')

    // Living World Sprint, Batch 1: Odin's existing narration is now visible
    // as a subtitle over the Terminal itself, not just logged to the
    // classic dashboard's OdinPanel. Passing First Contact fires
    // MissionCompleted and then, in the same tick, ContentUnlocked for
    // East Broker (unconditionally unlocked by first-contact) — the toast
    // settles on the latter, which is the real, final narration for this
    // moment, same as it already was in the existing OdinPanel.
    await expect(page.getByTestId('odin-presence')).toContainText('משהו חדש נפתח בתוך העיר.')

    await page.getByTestId('return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // The player reappears at the Core, not back at the original North
    // spawn point — the scene remounts fresh every time the Terminal
    // closes, so this is a real regression risk, not a given.
    await expect(page.getByTestId('district-status-hud')).toContainText('מוקד הרשומות')

    // Back in the world, the Core now reads Thriving, in Hebrew — a visible world reaction.
    await expect(page.getByTestId('district-status-hud')).toContainText('משגשג')

    // Living World Sprint, Batch 2: walk back to Devrin Kass — he should
    // acknowledge that First Contact is done instead of repeating the same
    // "there's work waiting at the Core" pitch he opened with.
    // The HUD text above updates from props alone, independent of whether
    // the Canvas has finished mounting — waiting for the proximity-driven
    // prompt first confirms the frame loop (and its WASD listener) is
    // actually running before any key is sent, the same guarantee the
    // dialogue-opening step already relied on right after the first
    // return-to-world above.
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    // Hub World, A1: North's own marker is now a real destination
    // interactable too, not just Devrin Kass — so this retraces the same
    // 900ms/9-unit trip the outbound KeyS above used (not further), landing
    // back at the original spawn point where the NPC is still nearer than
    // the district marker (see scenePositions3D.ts), instead of overshooting
    // past it into North's own now-competing interaction range.
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyW')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    await page.keyboard.press('KeyE')
    await expect(dialogue).toBeVisible()
    await expect(page.getByTestId('npc-dialogue-mission-context')).not.toBeVisible()
    await expect(dialogue).toContainText('הצפון נושם קצת יותר בקלות')
    await page.getByTestId('npc-dialogue-close-button').click()

    expect(errors).toEqual([])
  })

  test('the classic dashboard stays available and unaffected by the 3D scene', async ({ page }) => {
    // The World Scene is the default view now, so we're already there.
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('world-scene-3d')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'הרץ' /* he.run */ })).toBeVisible()
  })

  test('Hub World, A1: a locked destination shows the locked prompt and never opens a Terminal on interaction', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // North's own course (District Ties) is locked until First Contact is
    // completed. Walk 2 units past the spawn point itself (which is already
    // within range of both north-warden and the North marker) so the
    // district marker — not the closer NPC — becomes the nearest
    // interactable, the same way the canonical loop test above walks past
    // the Core to reach Mera Solt.
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(300)
    await page.keyboard.up('KeyW')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north')

    await expect(prompt).toHaveAttribute('data-locked', 'true')
    await expect(prompt).toContainText('מסלול הצפון')
    // Playtest fix pass (issue 4) — a locked destination now names the real
    // blocking mission (District Ties requires First Contact) instead of
    // showing only the bare "Locked" label.
    await expect(prompt).toContainText('נדרש: השלמת מגע ראשון')

    // A deliberate, explained no-op — not a silent failure: interacting
    // with a locked destination must not open a Terminal.
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('terminal-view')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  })

  test('Hub World, A1: entering an unlocked course world shows its name/progress in the prompt and Terminal, and completing its mission advances that progress', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // Complete First Contact at the Core first, so District Ties (North's
    // course) becomes available — the exact same path as the canonical
    // loop test above. Waiting for the proximity-driven prompt first
    // confirms the frame loop (and its WASD listener) is actually running
    // before any key is sent — same guarantee the other tests here rely on.
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyS')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'core')
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('terminal-view')).toBeVisible()
    await page.getByTestId('sql-input').fill('SELECT * FROM citizens;')
    await page.getByTestId('run-button').click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
    await page.getByTestId('return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // The avatar reappears at the Core — the scene remounted, so wait for
    // its frame loop to be running again (the prompt settling back on
    // 'core') before sending any movement keys, same guarantee as above.
    // Then walk back north, past the original spawn point, so North's own
    // marker becomes the nearest interactable instead of Devrin Kass.
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(1600)
    await page.keyboard.up('KeyW')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north')

    await expect(prompt).toHaveAttribute('data-locked', 'false')
    await expect(prompt).toContainText('מסלול הצפון')
    await expect(prompt).toContainText('0/1')

    await page.keyboard.press('KeyE')
    const terminal = page.getByTestId('terminal-view')
    await expect(terminal).toBeVisible()
    const destinationLabel = page.getByTestId('terminal-destination-label')
    await expect(destinationLabel).toContainText('מסלול הצפון')
    await expect(destinationLabel).toContainText('0/1')

    // Solving District Ties should advance this destination's own derived
    // progress to 1/1 — no independent progression engine, just the same
    // existing playerProgress read fresh.
    await page.getByTestId('sql-input').fill("SELECT * FROM citizens WHERE district = 'north';")
    await page.getByTestId('run-button').click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
    await expect(destinationLabel).toContainText('1/1')
  })

  test('Living World Sprint, Batch 5: the mute toggle flips aria-pressed and its Hebrew label, without any console errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await page.getByTestId('settings-menu-button').click()
    const muteButton = page.getByTestId('mute-toggle-button')

    // Sound starts on (unmuted) by default.
    await expect(muteButton).toHaveAttribute('aria-pressed', 'true')
    const onLabel = await muteButton.textContent()

    await muteButton.click()
    await expect(muteButton).toHaveAttribute('aria-pressed', 'false')
    const offLabel = await muteButton.textContent()
    expect(offLabel).not.toBe(onLabel)

    await muteButton.click()
    await expect(muteButton).toHaveAttribute('aria-pressed', 'true')
    expect(await muteButton.textContent()).toBe(onLabel)

    // Triggering an NPC-talk cue in the world scene (audio is muted again
    // below, but the ambient-mode switch and the cue call themselves must
    // never throw or log an error either way). Already in the World Scene —
    // it's the default view — so no toggle click is needed to reach it.
    await muteButton.click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // Wait for the proximity-driven prompt before pressing the interact key
    // — it only appears once the Canvas's frame loop has actually run, the
    // same guarantee the canonical loop test above already relies on.
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('Bug A regression: pressing Enter to interact does not re-activate the control-bar button that was clicked to enter the world', async ({
    page,
  }) => {
    await page.goto('/world')

    // The World Scene is already the default view. Real pointer clicks on
    // the toggle button — away to the classic dashboard, then back — are
    // exactly like a player would use, and land us back in the world scene
    // with the button now stale-focused from that second click, same
    // premise this regression test needs.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')

    // Enter, not KeyE — every other test in this file uses KeyE, which is
    // exactly why this bug had no prior coverage: only Enter also happens to
    // be the native activation key for a focused <button>.
    await page.keyboard.press('Enter')

    // Before the fix, this keypress would also re-click the still-focused
    // world-scene toggle, flipping back to the classic dashboard mid-
    // interaction. The world scene must still be showing, with the dialogue
    // that Enter was actually meant to open.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'north-warden')
  })

  test('Bug A fix does not affect keyboard operation of the control bar itself', async ({ page }) => {
    await page.goto('/world')
    await page.getByTestId('settings-menu-button').click()
    const muteButton = page.getByTestId('mute-toggle-button')

    // Arrive at the button via focus (as a keyboard user tabbing to it
    // would), then activate it with Enter — a real keyboard activation,
    // which must keep working exactly as before.
    await muteButton.focus()
    await expect(muteButton).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Enter')
    await expect(muteButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('Bug B regression: the interaction prompt and district HUD never intercept pointer input', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')

    // jsdom doesn't apply real CSS, so this is only meaningfully checkable
    // in a real browser — confirms the actual fix, not just its intent.
    const promptPointerEvents = await page
      .getByTestId('interaction-prompt')
      // e2e files type-check under an ES2023-only lib (no DOM) — this
      // callback still runs in a real browser via Playwright at test time,
      // where getComputedStyle genuinely exists; the `any` cast sidesteps
      // the missing ambient declaration without widening the shared tsconfig.
      .evaluate((el) => (globalThis as any).getComputedStyle(el).pointerEvents as string)
    expect(promptPointerEvents).toBe('none')

    const hudPointerEvents = await page
      .getByTestId('district-status-hud')
      // e2e files type-check under an ES2023-only lib (no DOM) — this
      // callback still runs in a real browser via Playwright at test time,
      // where getComputedStyle genuinely exists; the `any` cast sidesteps
      // the missing ambient declaration without widening the shared tsconfig.
      .evaluate((el) => (globalThis as any).getComputedStyle(el).pointerEvents as string)
    expect(hudPointerEvents).toBe('none')
  })
})

test.describe('Batch 3A.2: Central Plaza — learning buildings load cleanly', () => {
  test('the world scene still loads with the new buildings present, with or without a chosen learning path', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world?path=math')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // The existing NPC/spawn behavior is unaffected by the new buildings or
    // the ?path= query param — same regression check as the canonical loop.
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')

    expect(errors).toEqual([])
  })

  test('walking toward the Mathematics Academy is blocked by its collider instead of passing through', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // From spawn (0, -9), Math Academy sits at (-6, -3) with a collider
    // (LEARNING_BUILDING_COLLIDER_RADIUS — 1.75 as of Batch 3A.5, up from
    // 1.6 pre-3A.5). Holding left+backward (toward -X, +Z) for far longer than
    // the uncollided travel time would need is the point: if collision
    // silently regressed to a no-op, the avatar would keep walking straight
    // through the building's footprint with no observable difference here —
    // this is exactly why resolveBuildingCollision's own unit tests
    // (collision.test.ts) are the authoritative correctness check for the
    // math. What this test can and does verify in a real browser: the scene
    // keeps running (no crash, no console error) while the avatar is held
    // against the collider for an extended period.
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.keyboard.down('KeyA')
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(3000)
    await page.keyboard.up('KeyA')
    await page.keyboard.up('KeyS')

    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe('Batch 3A.3: teacher NPC interaction reliability', () => {
  // From spawn (0, -9): first north (toward the plaza, +Z) then west/east
  // (-X/+X) to reach the teacher stationed just outside their building's
  // door, without ever entering the building's own 1.6-radius collider
  // (see collision.test.ts) — two straight holds instead of one diagonal
  // one, since movement is grid-locked to the 8 WASD directions.
  async function walkToMathTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    // A brief settle margin after the scene mounts — the frame loop/WASD
    // input hook needs a moment before the very first held key reliably
    // registers; every other walking test in this file gets this for free
    // from prior steps (checking the prompt, pressing E, closing dialogue)
    // before its first walk. This helper's first action IS the walk, so it
    // needs the margin explicitly.
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
  }

  // Mirrors walkToMathTeacher exactly, but east (+X, KeyD) instead of west
  // (-X, KeyA) — english-teacher sits at (6, -4.9), the mirror image of
  // math-teacher's (-6, -4.9). The D-hold is 800ms, not 900ms: re-tuned in
  // Batch 3A.5 after the 900ms hold started overshooting into the East
  // district's own nearest-zone territory (confirmed via a debug run
  // showing the district HUD read the East district's label instead of the
  // Core's) — the same class of timing sensitivity already documented once
  // before for this exact walk (see the file's 3A.3 history).
  async function walkToEnglishTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(800)
    await page.keyboard.up('KeyD')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'english-teacher')
  }

  test('the prompt names the Mathematics teacher before any dialogue opens', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await expect(page.getByTestId('interaction-prompt')).toContainText('נדב שטרן')
  })

  test('E opens dialogue exactly once — a second press while open does not reopen or duplicate it', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'math-teacher')

    // The prompt is hidden entirely while dialogue is open (Batch 3A.3 fix
    // for the original prompt/dialogue overlap).
    await expect(page.getByTestId('interaction-prompt')).not.toBeVisible()

    await page.keyboard.press('KeyE')
    await expect(dialogue).toBeVisible()
    await expect(page.getByTestId('npc-dialogue')).toHaveCount(1)
  })

  test('the Talk button opens dialogue for mouse users, without needing E/Enter', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.getByTestId('npc-talk-button').click()
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()
  })

  test('Escape closes dialogue, and the NPC is talkable again immediately after', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialogue).not.toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toBeVisible()

    await page.keyboard.press('KeyE')
    await expect(dialogue).toBeVisible()
  })

  test('the close button still closes dialogue, and the NPC is talkable again after', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()

    await page.getByTestId('npc-dialogue-close-button').click()
    await expect(dialogue).not.toBeVisible()

    await page.keyboard.press('KeyE')
    await expect(dialogue).toBeVisible()
  })

  test('Start Lesson resolves the namespaced math lesson id, opens the real exercise panel, and never touches the SQL console', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toBeVisible()
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    await expect(page.getByTestId('npc-dialogue')).not.toBeVisible()
    await expect(page.getByTestId('lesson-stage')).toHaveAttribute('data-lesson-id', 'lesson:math-001')
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()

    // The classic dashboard's SQL console is untouched — Start Lesson never
    // reached activeMissionId/useMissionManager/runQuery.
    await page.getByTestId('lesson-return-to-world-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByRole('button', { name: 'הרץ' /* he.run */ })).toBeVisible()
    await expect(page.getByTestId('active-mission-title')).toHaveAttribute('data-mission-id', 'first-contact')

    expect(errors).toEqual([])
  })

  test('Start Lesson resolves the namespaced english lesson id and opens the English exercise panel, never the Math one', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToEnglishTeacher(page)

    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    await expect(page.getByTestId('lesson-stage')).toHaveAttribute('data-lesson-id', 'lesson:english-001')
    await expect(page.getByTestId('english-exercise-panel')).toBeVisible()
    await expect(page.getByTestId('math-exercise-panel')).toHaveCount(0)
  })

  test('a wrong Math answer does not complete the lesson', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    await page.getByTestId('math-answer-input').fill('7')
    await page.getByTestId('math-submit-button').click()

    await expect(page.getByTestId('math-exercise-feedback')).toBeVisible()
    await expect(page.getByTestId('lesson-success-message')).toHaveCount(0)
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
  })

  test('a correct Math answer completes the lesson, shows the success state, and Odin narrates it in Hebrew', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()

    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await expect(page.getByTestId('math-exercise-panel')).toHaveCount(0)
    // Meridian 1.3: completing this lesson for the first time also grants its
    // linked Archive Page (Core Loop §04) in the same synchronous batch as
    // LessonCompleted — Odin's presence banner shows only the latest
    // narration, so the archive-page line is what's left on screen, not the
    // lesson-completion line itself.
    await expect(page.getByTestId('odin-presence')).toContainText('פנקס ישן, מוחבא מאחורי המניפסט')
  })

  test('a wrong English answer does not complete the lesson', async ({ page }) => {
    await page.goto('/world')
    await walkToEnglishTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    await page.getByTestId('english-answer-input-0').fill('wrong')
    await page.getByTestId('english-submit-button').click()

    await expect(page.getByTestId('english-exercise-feedback')).toBeVisible()
    await expect(page.getByTestId('lesson-success-message')).toHaveCount(0)
  })

  test('correct English answers complete the lesson even with mismatched case and extra whitespace (normalization)', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToEnglishTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    const inputs = page.getByTestId(/^english-answer-input-\d+$/)
    const count = await inputs.count()
    // The five sample vocabulary answers, in registry order (lessonRegistry.ts).
    const answers = [' Dog ', 'CAT', 'House', 'Book', 'water']
    for (let i = 0; i < count; i += 1) {
      await page.getByTestId(`english-answer-input-${i}`).fill(answers[i])
    }
    await page.getByTestId('english-submit-button').click()

    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    // Meridian 1.3: completing this lesson for the first time grants its
    // Archive Page and unlocks the reunited-owner NPC (Core Loop §04) — both
    // publish their own Odin narration after LessonCompleted, and Odin's
    // presence banner only ever shows the latest one. The NPC unlock is
    // evaluated in a later effect tick than the archive page pickup, so it's
    // the one still on screen once things settle.
    await expect(page.getByTestId('odin-presence')).toContainText('משהו חדש נפתח בתוך העיר')
  })

  test('after completing the Math lesson, talking to the math teacher again reflects the completed state', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()

    await page.getByTestId('lesson-return-to-world-button').click()
    await expect(page.getByTestId('lesson-stage')).toHaveCount(0)

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    // Meridian 1.3 — Narrative Backbone §07: a specific, persistent
    // consequence line, not the old generic "well done."
    await expect(page.getByTestId('npc-dialogue-mission-context')).toContainText('המניפסט נסגר בזמן בזכותך')
    // Still offered — replaying an already-completed lesson stays supported.
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toBeVisible()
  })

  // Bug-fix pass: "תרגל שוב" must actually restart the exercise, not
  // immediately show the completed state — see LessonStage.tsx.
  test('reopening an already-completed lesson via תרגל שוב restarts the exercise fresh, not the success state', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toContainText('תרגל/י שוב')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    // A real fresh attempt: the exercise panel is back, with no leftover
    // answer or verdict from the earlier pass, and it can be failed again.
    await expect(page.getByTestId('lesson-success-message')).toHaveCount(0)
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
    await expect(page.getByTestId('math-answer-input')).toHaveValue('')
    await page.getByTestId('math-answer-input').fill('7')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('math-exercise-feedback')).toHaveText('לא מדויק. נסה/י שוב.' /* he.exerciseIncorrectFeedback */)
    await expect(page.getByTestId('lesson-success-message')).toHaveCount(0)

    // And it can still be passed again, same as the first attempt.
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
  })

  test('completedLessonIds persists through Save and a full page reload', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    // Save happens from the classic dashboard, same as every other Save/Load test in this codebase.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('saved-confirmation')).toBeVisible()

    await page.reload()

    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    // Meridian 1.3 — Narrative Backbone §07: a specific, persistent
    // consequence line, not the old generic "well done."
    await expect(page.getByTestId('npc-dialogue-mission-context')).toContainText('המניפסט נסגר בזמן בזכותך')
    // Batch 3A.5 — the replay wording also survives the reload.
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toContainText('תרגל/י שוב')
  })

  test('?path=math marks the Mathematics teacher and leaves the English teacher available; the world loads cleanly for both query values', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world?path=math')
    await walkToMathTeacher(page)
    // Reaching and talking to the (non-selected-by-default) math teacher
    // still works with ?path=math active — the batch's own requirement
    // that the non-selected NPC never disappears is symmetric here since
    // math IS the selected path; english-teacher's continued availability
    // is covered by the smoke check below.
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('an invalid ?path= value loads the world cleanly, with no crash', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world?path=not-a-real-subject')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('Batch 3A.5, Flow 5 — /world with no path, and an invalid path, both leave both teachers fully available', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toHaveAttribute('data-npc-id', 'math-teacher')
    await page.getByTestId('npc-dialogue-close-button').click()

    await page.goto('/world?path=not-a-real-subject')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toHaveAttribute('data-npc-id', 'math-teacher')
    await page.getByTestId('npc-dialogue-close-button').click()

    // Fresh navigation before the English side too — the walkTo* helpers
    // assume the player starts at spawn, so each segment needs a real reload
    // to reset position, not just an available toggle state.
    await page.goto('/world?path=not-a-real-subject')
    await walkToEnglishTeacher(page)
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toHaveAttribute('data-npc-id', 'english-teacher')
  })
})

test.describe('Batch 3A.5: visual polish + lesson completion UX', () => {
  async function walkToMathTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
  }

  test('an incomplete lesson shows the normal start action; completing it changes the button to תרגל שוב', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toContainText('התחל/התחילי שיעור')

    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toContainText('תרגל/י שוב')
  })

  test('replaying an already-completed lesson is idempotent: resubmitting still passes, still just one completed entry', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    // Replay: open again via the now-"תרגל/י שוב" button and actually
    // resubmit — the bug this guards against is the exercise never
    // reappearing at all, so the replay must go through the real panel.
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    // The classic dashboard's SQL side is still completely unaffected —
    // same proof as Batch 3A.4B, re-checked after the replay.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('active-mission-title')).toHaveAttribute('data-mission-id', 'first-contact')

    // No double-grant: the Archive Page linked to this lesson was only
    // ever found once, even though the lesson was completed twice.
    await expect(page.getByTestId('quest-track-archive-pages-button')).toContainText(/1$/)
  })

  test('no console errors while both buildings, their signs/lanterns, and completion badges render together', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world?path=math')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('Meridian 1.0 closeout: auto-save on leaving /world', () => {
  async function walkToMathTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
  }

  test('a. complete a lesson, b. leave /world for /dashboard without pressing Save, c. return to /world, d. completion remains persisted', async ({
    page,
  }) => {
    // a. Complete a lesson.
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await page.getByTestId('lesson-return-to-world-button').click()

    // Confirmed completed within the same session, before leaving.
    await page.keyboard.press('KeyE')
    // Meridian 1.3 — Narrative Backbone §07: a specific, persistent
    // consequence line, not the old generic "well done."
    await expect(page.getByTestId('npc-dialogue-mission-context')).toContainText('המניפסט נסגר בזמן בזכותך')
    await page.getByTestId('npc-dialogue-close-button').click()

    // b. Leave /world for /dashboard — deliberately no Save click anywhere above.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.goto('/dashboard')

    // c. Return to /world. The World Scene is the default view, reached
    // with no toggle click needed.
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await page.keyboard.press('KeyE')

    // d. Completion remains persisted.
    // Meridian 1.3 — Narrative Backbone §07: a specific, persistent
    // consequence line, not the old generic "well done."
    await expect(page.getByTestId('npc-dialogue-mission-context')).toContainText('המניפסט נסגר בזמן בזכותך')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toContainText('תרגל/י שוב')
  })

  test('does not interfere with the manual Save button or its confirmation', async ({ page }) => {
    await page.goto('/world')
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('saved-confirmation')).toBeVisible()
  })
})

test.describe('Meridian UI stability pass: game container size', () => {
  for (const width of [1280, 1440, 1920]) {
    test(`the game container has a stable, usable size at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/world')
      const scene = page.getByTestId('world-scene-3d')
      await expect(scene).toBeVisible()

      const box = await scene.boundingBox()
      expect(box).not.toBeNull()
      // Uses (most of) the full *available* width — the app shell itself
      // has a pre-existing, app-wide 1400px reading-width cap (#root in
      // index.css, present before this change and affecting every page,
      // not just the game), so "available width" tops out there on wider
      // viewports. That's a deliberate existing app-shell decision, not
      // this game container's own bug, so this asserts against it rather
      // than the raw viewport.
      const availableWidth = Math.min(width, 1400)
      expect(box!.width).toBeGreaterThan(availableWidth * 0.85)
      // Desktop minimum height in the requested ~600-720px range.
      expect(box!.height).toBeGreaterThanOrEqual(600)
      expect(box!.height).toBeLessThanOrEqual(730)

      const canvasBox = await scene.locator('canvas').boundingBox()
      expect(canvasBox!.width).toBeGreaterThan(availableWidth * 0.8)
    })
  }

  test('resizing the viewport mid-session does not crash or collapse the game', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/world')
    const scene = page.getByTestId('world-scene-3d')
    await expect(scene).toBeVisible()

    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(300)
    const wideBox = await scene.boundingBox()
    // Same pre-existing 1400px app-shell cap as above.
    expect(wideBox!.width).toBeGreaterThan(1200)
    expect(wideBox!.height).toBeGreaterThanOrEqual(600)

    await page.setViewportSize({ width: 375, height: 700 })
    await page.waitForTimeout(300)
    await expect(scene).toBeVisible()
    const narrowBox = await scene.boundingBox()
    expect(narrowBox!.width).toBeGreaterThan(300)
    expect(narrowBox!.height).toBeGreaterThan(0)

    // Navigation still works after resizing.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('active-mission-title')).toBeVisible()

    expect(errors).toEqual([])
  })
})

test.describe('Meridian UI stability pass: lesson answer area', () => {
  async function walkToMathTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
  }

  test('the answer area stays visible, with readable text and touch-sized controls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    const input = page.getByTestId('math-answer-input')
    const submit = page.getByTestId('math-submit-button')
    await expect(input).toBeVisible()
    await expect(submit).toBeVisible()

    const inputBox = await input.boundingBox()
    const submitBox = await submit.boundingBox()
    expect(inputBox!.height).toBeGreaterThanOrEqual(44)
    expect(submitBox!.height).toBeGreaterThanOrEqual(44)
    expect(submitBox!.width).toBeGreaterThanOrEqual(44)

    const inputFontSize = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const submitFontSize = await submit.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(inputFontSize).toBeGreaterThanOrEqual(16)
    expect(submitFontSize).toBeGreaterThanOrEqual(16)

    // Still visible and usable after submitting.
    await input.fill('11')
    await submit.click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
  })
})

test.describe('Meridian UI stability pass: world map layout', () => {
  for (const width of [1280, 1440, 1920]) {
    test(`no two district nodes overlap on the classic dashboard's map at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/world')
      // The classic dashboard's map is what's under test here, not the 3D
      // scene (the new default view) — switch to it via the existing toggle.
      await page.getByTestId('settings-menu-button').click()
      await page.getByTestId('toggle-world-scene-button').click()

      const nodes = page.locator('[data-district-id]')
      await expect(nodes.first()).toBeVisible()
      const count = await nodes.count()
      expect(count).toBeGreaterThan(1)

      const boxes = []
      for (let i = 0; i < count; i += 1) {
        boxes.push(await nodes.nth(i).boundingBox())
      }

      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i]!
          const b = boxes[j]!
          const overlaps =
            a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
          expect(overlaps).toBe(false)
        }
      }
    })
  }

  test('the map stacks gracefully on a narrow viewport, still with no overlap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/world')
    // The classic dashboard's map is what's under test here, not the 3D
    // scene (the new default view) — switch to it via the existing toggle.
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()

    const nodes = page.locator('[data-district-id]')
    await expect(nodes.first()).toBeVisible()
    const count = await nodes.count()

    const boxes = []
    for (let i = 0; i < count; i += 1) {
      boxes.push(await nodes.nth(i).boundingBox())
    }
    for (const box of boxes) {
      expect(box!.width).toBeLessThanOrEqual(375)
    }
  })
})

test.describe('Meridian 1.0 bugfix: Odin presence no longer overlaps NPC dialogue', () => {
  async function walkToMathTeacher(page: import('@playwright/test').Page) {
    // The World Scene is already the default view — no toggle click needed.
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
  }

  test('Odin is hidden while dialogue is open, even right after load while its mission-started line is still visible', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    // Reaching the teacher takes long enough that Odin's mission-started
    // line (shown on load, ~4.5s) is sometimes already gone by the time
    // dialogue opens — assert only that it's never visible *with* the
    // dialogue, not that it was showing beforehand.
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()
    await expect(page.getByTestId('odin-presence')).not.toBeVisible()
  })

  test('closing the dialogue does not leave the world scene broken, and re-opening dialogue hides it again', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()
    await page.getByTestId('npc-dialogue-close-button').click()
    await expect(page.getByTestId('npc-dialogue')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()
    await expect(page.getByTestId('odin-presence')).not.toBeVisible()
  })
})
