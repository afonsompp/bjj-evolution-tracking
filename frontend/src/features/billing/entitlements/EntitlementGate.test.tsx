import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { hasFeature } = vi.hoisted(() => ({ hasFeature: vi.fn() }))
vi.mock('./useEntitlements', () => ({ useEntitlements: () => ({ hasFeature }) }))

import { EntitlementGate } from './EntitlementGate'

beforeEach(() => vi.clearAllMocks())

describe('EntitlementGate', () => {
  it('renders children when the feature is entitled', () => {
    hasFeature.mockReturnValue(true)
    render(
      <EntitlementGate feature="ADVANCED_STATS">
        <span>premium</span>
      </EntitlementGate>,
    )
    expect(hasFeature).toHaveBeenCalledWith('ADVANCED_STATS')
    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('renders the fallback (and not the children) when not entitled', () => {
    hasFeature.mockReturnValue(false)
    render(
      <EntitlementGate feature="AI_INSIGHTS" fallback={<span>upgrade</span>}>
        <span>premium</span>
      </EntitlementGate>,
    )
    expect(screen.queryByText('premium')).not.toBeInTheDocument()
    expect(screen.getByText('upgrade')).toBeInTheDocument()
  })

  it('renders nothing when not entitled and no fallback is given', () => {
    hasFeature.mockReturnValue(false)
    const { container } = render(
      <EntitlementGate feature="BILLING">
        <span>premium</span>
      </EntitlementGate>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
