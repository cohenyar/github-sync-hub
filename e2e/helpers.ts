import { expect, type Locator, type Page } from '@playwright/test'

/** Waits for the mission database to finish preparing and returns the Run button. */
export async function waitForMissionReady(page: Page): Promise<Locator> {
  const runButton = page.getByTestId('run-button')
  await expect(runButton).toBeEnabled()
  return runButton
}

/** Types a query into the SQL editor and clicks Run. */
export async function runSql(page: Page, sql: string): Promise<void> {
  await page.getByTestId('sql-input').fill(sql)
  await page.getByTestId('run-button').click()
}

/** True once the verdict banner shows a passing result. */
export function verdictIsPass(page: Page) {
  return expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
}

/** True once the verdict banner shows a failing result. */
export function verdictIsFail(page: Page) {
  return expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'fail')
}
