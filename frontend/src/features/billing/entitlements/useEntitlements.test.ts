import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEntitlements } from './useEntitlements'
import type { Feature } from './capabilities'

const ALL_FEATURES: Feature[] = [
  'TRAINING_LOG',
  'ADVANCED_STATS',
  'AI_INSIGHTS',
  'ACADEMY_MANAGEMENT',
  'BILLING',
  'ANALYTICS_EXPORT',
]

describe('useEntitlements', () => {
  // Placeholder implementation: every feature is currently unlocked. This test
  // pins that contract so it fails loudly the day real gating is introduced.
  it('grants every known feature', () => {
    const { result } = renderHook(() => useEntitlements())
    for (const feature of ALL_FEATURES) {
      expect(result.current.hasFeature(feature)).toBe(true)
    }
  })
})
