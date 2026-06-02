import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const { requestPasswordReset } = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }))
vi.mock('../../lib/auth/authClient', () => ({ authClient: { requestPasswordReset } }))

import ForgotPasswordForm from './ForgotPasswordForm'

beforeEach(() => vi.clearAllMocks())

describe('ForgotPasswordForm', () => {
  it('requests a reset and shows the confirmation screen on success', async () => {
    const user = userEvent.setup()
    requestPasswordReset.mockResolvedValue({ error: null })
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(requestPasswordReset).toHaveBeenCalledWith('me@example.com')
    expect(await screen.findByText('Check your email')).toBeInTheDocument()
  })

  it('surfaces an API error and keeps the form visible', async () => {
    const user = userEvent.setup()
    requestPasswordReset.mockResolvedValue({ error: { message: 'Too many requests' } })
    renderWithProviders(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByText('Too many requests')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
  })
})
