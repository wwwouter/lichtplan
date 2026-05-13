import { expect, test } from 'playwright/test'

test('shows the full open picker error in the visible toast', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => {
        const error = new Error('The file handle cannot be read in this browser context')
        error.name = 'NotAllowedError'
        error.stack =
          'NotAllowedError: The file handle cannot be read in this browser context\n    at showOpenFilePicker'
        throw error
      }
    })
  })

  await page.goto('./')
  await page.getByRole('button', { name: /Openen/ }).click()

  const toast = page.getByRole('status')
  await expect(toast).toContainText('Openen mislukt')
  await expect(toast).toContainText('Volledige fout')
  await expect(toast).toContainText('NotAllowedError')
  await expect(toast).toContainText('The file handle cannot be read in this browser context')
  await expect(toast).toContainText('at showOpenFilePicker')
})
