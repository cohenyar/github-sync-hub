import { expect, test } from '@playwright/test'
import { runSql, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('Admin CRUD for Missions and NPCs', () => {
  test('creates, edits, and deletes a mission through the Admin form', async ({ page }) => {
    await page.goto('/world')
    await page.getByRole('button', { name: 'Admin' }).click()

    const missionsCard = page.locator('[data-section-id="missions"]')
    await expect(missionsCard).toContainText('Items: 6')

    await missionsCard.getByLabel('Mission id').fill('e2e-test-mission')
    await missionsCard.getByLabel('Mission title').fill('E2E Test Mission')
    await missionsCard.getByLabel('Mission goal').fill('Verify Admin CRUD end to end.')
    await missionsCard.getByLabel('Mission prompt').fill('Prompt text.')
    await missionsCard.getByLabel('Mission setup SQL').fill('CREATE TABLE t (id INTEGER);')
    await missionsCard.getByLabel('Mission reference SQL').fill('SELECT * FROM t;')
    await missionsCard.getByRole('button', { name: 'Add Mission' }).click()

    await expect(missionsCard).toContainText('Items: 7')
    await expect(missionsCard.getByText('E2E Test Mission')).toBeVisible()

    await missionsCard.getByRole('button', { name: 'Edit E2E Test Mission' }).click()
    await missionsCard.getByLabel('Mission title').fill('E2E Test Mission (renamed)')
    await missionsCard.getByRole('button', { name: 'Save Mission' }).click()

    await expect(missionsCard.getByText('E2E Test Mission (renamed)')).toBeVisible()
    await expect(missionsCard.getByText('E2E Test Mission', { exact: true })).toHaveCount(0)

    await missionsCard.getByRole('button', { name: 'Delete E2E Test Mission (renamed)' }).click()

    await expect(missionsCard).toContainText('Items: 6')
    await expect(missionsCard.getByText('E2E Test Mission (renamed)')).toHaveCount(0)
  })

  test('creates, edits, and deletes an NPC through the Admin form', async ({ page }) => {
    await page.goto('/world')
    await page.getByRole('button', { name: 'Admin' }).click()

    const npcsCard = page.locator('[data-section-id="npcs"]')
    await expect(npcsCard).toContainText('Items: 7')

    await npcsCard.getByLabel('NPC id').fill('e2e-test-npc')
    await npcsCard.getByLabel('NPC name').fill('E2E Test NPC')
    await npcsCard.getByLabel('NPC district').selectOption('north')
    await npcsCard.getByLabel('NPC role').fill('Tester')
    await npcsCard.getByLabel('NPC description').fill('A temporary NPC created by a Playwright test.')
    await npcsCard.getByRole('button', { name: 'Add NPC' }).click()

    await expect(npcsCard).toContainText('Items: 8')
    await expect(npcsCard.getByText('E2E Test NPC')).toBeVisible()

    // Not gated by any unlock rule, but the Unlock Engine's rule set is
    // still whatever existed at app boot — Step 27 manages content, not
    // the Unlock Engine, so a brand-new NPC never gets a rule this session
    // and stays off the (unlock-gated) World Map. This is expected, not a bug.
    await expect(page.locator('[data-district-id="north"]').getByText('E2E Test NPC')).toHaveCount(0)

    await npcsCard.getByRole('button', { name: 'Edit E2E Test NPC' }).click()
    await npcsCard.getByLabel('NPC name').fill('E2E Test NPC (renamed)')
    await npcsCard.getByRole('button', { name: 'Save NPC' }).click()

    await expect(npcsCard.getByText('E2E Test NPC (renamed)')).toBeVisible()

    await npcsCard.getByRole('button', { name: 'Delete E2E Test NPC (renamed)' }).click()

    await expect(npcsCard).toContainText('Items: 7')
    await expect(npcsCard.getByText('E2E Test NPC (renamed)')).toHaveCount(0)
  })

  test('Admin CRUD activity does not affect real gameplay', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await page.getByRole('button', { name: 'Admin' }).click()

    const missionsCard = page.locator('[data-section-id="missions"]')
    await missionsCard.getByLabel('Mission id').fill('e2e-noop-mission')
    await missionsCard.getByLabel('Mission title').fill('Noop Mission')
    await missionsCard.getByLabel('Mission goal').fill('Goal')
    await missionsCard.getByLabel('Mission prompt').fill('Prompt')
    await missionsCard.getByLabel('Mission setup SQL').fill('CREATE TABLE t (id INTEGER);')
    await missionsCard.getByLabel('Mission reference SQL').fill('SELECT * FROM t;')
    await missionsCard.getByRole('button', { name: 'Add Mission' }).click()

    await page.getByRole('button', { name: 'Hide Admin' }).click()

    // The live SQL console still targets First Contact, unaffected by the
    // new (unwired) mission sitting in the registry.
    await waitForMissionReady(page)
    await expect(page.getByTestId('active-mission-title')).toHaveAttribute('data-mission-id', 'first-contact')

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')

    expect(errors).toEqual([])
  })
})
