import type { Feature } from './capabilities'

interface EntitlementState {
  hasFeature: (feature: Feature) => boolean
}

export function useEntitlements(): EntitlementState {
  return {
    hasFeature: (_feature: Feature) => true,
  }
}
