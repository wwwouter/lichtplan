import { expect, test } from 'playwright/test'

test('opens a .lichtplan file through the working file input path', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__openPickerCalled', {
      configurable: true,
      writable: true,
      value: false
    })
    Object.defineProperty(window, 'showOpenFilePicker', {
      configurable: true,
      value: async () => {
        ;(window as Window & { __openPickerCalled?: boolean }).__openPickerCalled = true
        throw new Error('showOpenFilePicker should not be used for opening projects')
      }
    })
  })

  await page.goto('./')

  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: /Openen/ }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({
    name: 'woning.lichtplan',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        id: 'project-e2e',
        name: 'Woning E2E',
        floors: [
          {
            id: 'floor-e2e',
            name: 'Begane grond',
            floorPlanImage: null,
            symbols: [],
            order: 0
          }
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
    )
  })

  await expect(page.getByRole('status')).toContainText('Project geopend: woning.lichtplan.')
  await expect(page).toHaveTitle('Lichtplan - Woning E2E')
  await expect(
    page.evaluate(() => Boolean((window as Window & { __openPickerCalled?: boolean }).__openPickerCalled))
  ).resolves.toBe(false)
})
