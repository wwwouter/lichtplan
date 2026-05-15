import { expect, test } from 'playwright/test'

test('saves a .lichtplan file through the browser download path', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__savePickerCalled', {
      configurable: true,
      writable: true,
      value: false
    })
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: async () => {
        ;(window as Window & { __savePickerCalled?: boolean }).__savePickerCalled = true
        throw new Error('showSaveFilePicker should not be used for web project saves')
      }
    })
  })

  await page.goto('./')

  const downloadPromise = page.waitForEvent('download', { timeout: 3_000 })
  await page.getByRole('button', { name: /Opslaan/ }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/\.lichtplan$/)
  await expect(page.getByRole('status')).toContainText('Project opgeslagen')
  await expect(
    page.evaluate(() => Boolean((window as Window & { __savePickerCalled?: boolean }).__savePickerCalled))
  ).resolves.toBe(false)
})
