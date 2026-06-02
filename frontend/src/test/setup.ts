import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// React Testing Library mounts into a shared document; unmount between tests
// so component trees don't leak across the suite.
afterEach(() => {
  cleanup()
})

// jsdom has no matchMedia; ThemeProvider reads it for the initial color scheme.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList
}

// jsdom has no IntersectionObserver; components that use it for infinite-scroll
// (e.g. TechniquePicker) just need a no-op so the effect doesn't throw.
if (!('IntersectionObserver' in globalThis)) {
  class MockIntersectionObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = []
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}
