import type { Feature } from './capabilities'

interface EntitlementState {
  hasFeature: (feature: Feature) => boolean
}

export function useEntitlements(): EntitlementState {
  return {
    // Placeholder: every feature is currently unlocked.
    hasFeature: () => true,
  }
}
