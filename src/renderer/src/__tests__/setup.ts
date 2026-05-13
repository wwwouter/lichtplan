import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.api for tests
Object.defineProperty(window, 'api', {
  configurable: true,
  writable: true,
  value: {
    openProject: vi.fn(),
    saveProject: vi.fn(),
    saveProjectAs: vi.fn(),
    openImage: vi.fn(),
    exportPNG: vi.fn(),
    exportPDF: vi.fn(),
    setTitle: vi.fn(),
    onMenuAction: vi.fn(() => vi.fn())
  }
})
