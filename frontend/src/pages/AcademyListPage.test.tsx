import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const searchState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const membershipsState = vi.hoisted(() => ({ value: { data: { content: [] as unknown[] } } }))
const profileState = vi.hoisted(() => ({ value: { data: { role: 'CUSTOMER' } } as { data: { role: string } } }))

vi.mock('../features/academy/hooks/useAcademySearch', () => ({ useAcademySearch: () => searchState.value }))
vi.mock('../features/academy/hooks/useMyMemberships', () => ({ useMyMemberships: () => membershipsState.value }))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import AcademyListPage from './AcademyListPage'

beforeEach(() => {
  vi.clearAllMocks()
  searchState.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
  membershipsState.value = { data: { content: [] } }
  profileState.value = { data: { role: 'CUSTOMER' } }
})

describe('AcademyListPage', () => {
  it('lists search results', () => {
    searchState.value = {
      data: {
        content: [{ id: 'a1', name: 'Evolution', address: 'Rua X' }],
        totalElements: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<AcademyListPage />)
    expect(screen.getByText('Evolution')).toBeInTheDocument()
    expect(screen.getByText('Rua X')).toBeInTheDocument()
  })

  it('shows the empty state when no academies match', () => {
    renderWithProviders(<AcademyListPage />)
    expect(screen.getByText('No academies yet')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    searchState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<AcademyListPage />)
    expect(screen.getByText('Failed to load academies. Try again later.')).toBeInTheDocument()
  })

  it('renders the "My Academies" section for members', () => {
    membershipsState.value = {
      data: { content: [{ academyId: 'a1', academyName: 'Home Mat', academyAddress: 'Rua Y' }] },
    }
    renderWithProviders(<AcademyListPage />)
    expect(screen.getByText('My Academies')).toBeInTheDocument()
    expect(screen.getByText('Home Mat')).toBeInTheDocument()
  })

  it('hides the create button for regular users', () => {
    renderWithProviders(<AcademyListPage />)
    expect(screen.queryByRole('button', { name: 'New Academy' })).not.toBeInTheDocument()
  })

  it('lets an admin create an academy', async () => {
    const user = userEvent.setup()
    profileState.value = { data: { role: 'ADMIN' } }
    renderWithProviders(<AcademyListPage />)
    await user.click(screen.getByRole('button', { name: 'New Academy' }))
    expect(navigate).toHaveBeenCalledWith('/academies/new')
  })
})
