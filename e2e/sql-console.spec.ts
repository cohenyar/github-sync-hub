import { expect, runSql, test, verdictIsFail, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('SQL console', () => {
  test('a correct query shows Pass and the matching rows', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')

    await verdictIsPass(page)
    await expect(page.getByText('Iris Vell')).toBeVisible()
    await expect(page.getByText('Bram Osei')).toBeVisible()
    await expect(page.getByText('Talia Nkemdirim')).toBeVisible()
    await expect(page.getByText('Coen Adeyemi')).toBeVisible()
  })

  test('a query missing rows shows Fail with only the partial result', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens WHERE id = 1;')

    await verdictIsFail(page)
    await expect(page.getByText('Iris Vell')).toBeVisible()
    await expect(page.getByText('Bram Osei')).not.toBeVisible()
    await expect(
      // VerdictBanner buildFailHint: missing-rows case
      page.getByText('ציפינו ל-4 שורות, התקבלו 1. חסרות 3 שורות — ייתכן שהתנאי מצומצם מדי.'),
    ).toBeVisible()
  })

  test('invalid SQL shows a syntax error instead of a verdict', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELEKT * FROM citizens;')

    await expect(page.getByTestId('sql-error-message')).toBeVisible()
    await expect(page.getByTestId('verdict-banner')).not.toBeVisible()
  })
})
