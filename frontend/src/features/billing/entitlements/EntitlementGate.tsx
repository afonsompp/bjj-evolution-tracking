import type { ReactNode } from 'react'
import { useEntitlements } from './useEntitlements'
import type { Feature } from './capabilities'

interface EntitlementGateProps {
  feature: Feature
  children: ReactNode
  fallback?: ReactNode
}

export function EntitlementGate({ feature, children, fallback = null }: EntitlementGateProps) {
  const { hasFeature } = useEntitlements()
  return hasFeature(feature) ? <>{children}</> : <>{fallback}</>
}
