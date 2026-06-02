import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AcademyPermissionsResult } from './useAcademyPermissions'

const { useAcademyPermissions } = vi.hoisted(() => ({ useAcademyPermissions: vi.fn() }))
vi.mock('./useAcademyPermissions', () => ({ useAcademyPermissions }))

import { AcademyPermissionGate } from './AcademyPermissionGate'

const perms = (over: Partial<AcademyPermissionsResult> = {}): AcademyPermissionsResult => ({
  role: 'STUDENT',
  isLoading: false,
  canViewSchedule: false,
  canManageClasses: false,
  canManageMembers: false,
  canEditAcademy: false,
  canPromoteMember: false,
  canManageBilling: false,
  ...over,
})

beforeEach(() => vi.clearAllMocks())

describe('AcademyPermissionGate', () => {
  it('renders children when the required capability is granted', () => {
    useAcademyPermissions.mockReturnValue(perms({ canManageClasses: true }))
    render(
      <AcademyPermissionGate academyId="a1" require="canManageClasses">
        <span>manage</span>
      </AcademyPermissionGate>,
    )
    expect(useAcademyPermissions).toHaveBeenCalledWith('a1')
    expect(screen.getByText('manage')).toBeInTheDocument()
  })

  it('renders the fallback when the capability is missing', () => {
    useAcademyPermissions.mockReturnValue(perms({ canManageClasses: false }))
    render(
      <AcademyPermissionGate academyId="a1" require="canManageClasses" fallback={<span>denied</span>}>
        <span>manage</span>
      </AcademyPermissionGate>,
    )
    expect(screen.queryByText('manage')).not.toBeInTheDocument()
    expect(screen.getByText('denied')).toBeInTheDocument()
  })

  it('renders nothing while permissions are loading', () => {
    useAcademyPermissions.mockReturnValue(perms({ isLoading: true, canManageClasses: true }))
    const { container } = render(
      <AcademyPermissionGate academyId="a1" require="canManageClasses">
        <span>manage</span>
      </AcademyPermissionGate>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
