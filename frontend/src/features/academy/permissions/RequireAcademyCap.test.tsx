import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AcademyPermissionsResult } from './useAcademyPermissions'

const { useAcademyPermissions } = vi.hoisted(() => ({ useAcademyPermissions: vi.fn() }))
vi.mock('./useAcademyPermissions', () => ({ useAcademyPermissions }))

import { RequireAcademyCap } from './RequireAcademyCap'

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

function renderGuarded(children: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/academies/a1/manage']}>
      <Routes>
        <Route
          path="/academies/:id/manage"
          element={<RequireAcademyCap cap="canManageMembers">{children}</RequireAcademyCap>}
        />
        <Route path="/academies/:id" element={<div>visitor view</div>} />
        <Route path="/academies" element={<div>academies list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('RequireAcademyCap', () => {
  it('passes the :id from the URL to the permissions hook', () => {
    useAcademyPermissions.mockReturnValue(perms({ canManageMembers: true }))
    renderGuarded(<div>protected</div>)
    expect(useAcademyPermissions).toHaveBeenCalledWith('a1')
  })

  it('renders children when the capability is granted', () => {
    useAcademyPermissions.mockReturnValue(perms({ canManageMembers: true }))
    renderGuarded(<div>protected</div>)
    expect(screen.getByText('protected')).toBeInTheDocument()
  })

  it('redirects to the academy visitor view when the capability is missing', () => {
    useAcademyPermissions.mockReturnValue(perms({ canManageMembers: false }))
    renderGuarded(<div>protected</div>)
    expect(screen.queryByText('protected')).not.toBeInTheDocument()
    expect(screen.getByText('visitor view')).toBeInTheDocument()
  })

  it('shows neither the children nor a redirect while loading', () => {
    useAcademyPermissions.mockReturnValue(perms({ isLoading: true, canManageMembers: true }))
    renderGuarded(<div>protected</div>)
    expect(screen.queryByText('protected')).not.toBeInTheDocument()
    expect(screen.queryByText('visitor view')).not.toBeInTheDocument()
  })
})
