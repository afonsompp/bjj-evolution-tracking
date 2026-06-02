import { vi, describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'

vi.mock('../lib/auth/authClient', () => ({ authClient: { signUp: vi.fn() } }))

import RegisterPage from './RegisterPage'

describe('RegisterPage', () => {
  it('renders the register form', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })
})
