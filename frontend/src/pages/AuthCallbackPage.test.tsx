import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getSession } } }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import AuthCallbackPage from './AuthCallbackPage'

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = ''
})

describe('AuthCallbackPage', () => {
  it('sends the confirmed user to onboarding once the session lands', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 't' } } })
    renderWithProviders(<AuthCallbackPage />)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/onboarding', { replace: true }),
    )
  })

  it('surfaces the link error and does not navigate', async () => {
    window.location.hash =
      '#error=access_denied&error_description=Email+link+is+invalid+or+has+expired'
    getSession.mockResolvedValue({ data: { session: null } })
    renderWithProviders(<AuthCallbackPage />)

    expect(
      await screen.findByText('Email link is invalid or has expired'),
    ).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
