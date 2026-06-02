import { vi, describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'

// LoginForm imports authClient (→ supabase); mocked so the wrapper renders in isolation.
vi.mock('../lib/auth/authClient', () => ({ authClient: { signIn: vi.fn() } }))

import LoginPage from './LoginPage'

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })
})
