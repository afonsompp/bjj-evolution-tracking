import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import ErrorPage from './ErrorPage'

beforeEach(() => vi.clearAllMocks())

describe('ErrorPage', () => {
  it('renders the 500 message and both actions', () => {
    renderWithProviders(<ErrorPage />)
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('navigates home from the secondary action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ErrorPage />)
    await user.click(screen.getByRole('button', { name: 'Go to Dashboard' }))
    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })
})
