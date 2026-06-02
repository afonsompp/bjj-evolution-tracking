import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'

const profileState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))
vi.mock('../features/profile/ProfileForm', () => ({ default: () => <div>profile-form</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import OnboardingPage from './OnboardingPage'

beforeEach(() => {
  vi.clearAllMocks()
  profileState.value = { data: undefined, isLoading: false }
})

describe('OnboardingPage', () => {
  it('shows a loading message while the profile is loading', () => {
    profileState.value = { data: undefined, isLoading: true }
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders the onboarding form when no profile exists', () => {
    renderWithProviders(<OnboardingPage />)
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    expect(screen.getByText('profile-form')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('redirects to the dashboard when a profile already exists', () => {
    profileState.value = { data: { id: 'u1' }, isLoading: false }
    renderWithProviders(<OnboardingPage />)
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })
})
