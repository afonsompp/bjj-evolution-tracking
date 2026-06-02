import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import NotFoundPage from './NotFoundPage'

beforeEach(() => vi.clearAllMocks())

describe('NotFoundPage', () => {
  it('renders the 404 message', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('navigates home from the call to action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotFoundPage />)
    await user.click(screen.getByRole('button', { name: 'Go to Dashboard' }))
    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })
})
