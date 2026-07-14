import { expect, test } from '@playwright/test'

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

    await page.goto('/world')
    await page.getByTestId('toggle-world-scene-button').click()
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
    // within interaction range. A direct click on the Core mesh must still
    // win over "nearest interactable" instead of silently no-oping.
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(650)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(400)
    await page.keyboard.up('KeyA')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'archivist-mera')

    // The Core sits at the world origin and the fixed camera always looks
    // directly at the origin (see SceneCamera/CAMERA_LOOK_AT), so the exact
    // center of the rendered canvas always lands on the Core regardless of
    // where the player currently stands — a stable click target that
    // doesn't depend on guessed pixel coordinates.
    const canvasBox = await page.locator('[data-testid="world-scene-3d"] canvas').boundingBox()
    if (!canvasBox) throw new Error('World scene canvas did not render')
    await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
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
    await expect(page.getByTestId('odin-presence')).toContainText('Something new has opened within the city.')

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
    await page.goto('/world')

    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('world-scene-3d')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  })

  test('Hub World, A1: a locked destination shows the locked prompt and never opens a Terminal on interaction', async ({
    page,
  }) => {
    await page.goto('/world')
    await page.getByTestId('toggle-world-scene-button').click()
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
    await expect(prompt).toContainText('נעול')

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
    await page.getByTestId('toggle-world-scene-button').click()
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

    // Entering the world scene and triggering an NPC-talk cue (audio is
    // muted again below, but the ambient-mode switch and the cue call
    // themselves must never throw or log an error either way).
    await muteButton.click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // Wait for the proximity-driven prompt before pressing the interact key
    // — it only appears once the Canvas's frame loop has actually run, the
    // same guarantee the canonical loop test above already relies on.
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()

    expect(errors).toEqual([])
  })
})
