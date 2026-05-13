import { expect, test } from 'playwright/test'

test('loads without browser console errors', async ({ page }) => {
  const problems: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`)
  })

  await page.goto('./')
  await expect(page.getByText('Symbolen', { exact: true })).toBeVisible()
  await expect(page.locator('.loading-overlay')).toHaveCount(0)

  expect(problems).toEqual([])
})
