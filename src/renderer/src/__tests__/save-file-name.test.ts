import { afterEach, describe, expect, it, vi } from 'vitest'
import { refreshTimestampSuffix } from '../services/saveFileName'

describe('save file name', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces a yyyy-mm-ddThh:mm suffix before the extension with the current local minute', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12, 34, 56))

    expect(refreshTimestampSuffix('/downloads/woning-2026-05-18T09:15.lichtplan')).toBe(
      '/downloads/woning-2026-05-19T12:34.lichtplan'
    )
  })

  it('preserves compact timestamp style when the existing file name uses it', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12, 34, 56))

    expect(refreshTimestampSuffix('woning-2026-05-18T0915.lichtplan')).toBe(
      'woning-2026-05-19T1234.lichtplan'
    )
  })

  it('leaves file names without a timestamp suffix unchanged', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12, 34, 56))

    expect(refreshTimestampSuffix('/downloads/woning.lichtplan')).toBe('/downloads/woning.lichtplan')
  })
})
