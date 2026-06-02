import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('../features/academy/hooks/useCreateAcademy', () => ({
  useCreateAcademy: () => ({ mutate: create, isPending: false }),
}))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import AcademyCreatePage from './AcademyCreatePage'

beforeEach(() => vi.clearAllMocks())

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('e.g. Evolution BJJ'), 'Evolution')
  await user.type(screen.getByPlaceholderText('e.g. Rua das Flores, 123'), 'Rua X')
}

describe('AcademyCreatePage', () => {
  it('renders the create title', () => {
    renderWithProviders(<AcademyCreatePage />)
    expect(screen.getByRole('heading', { name: 'Create Academy' })).toBeInTheDocument()
  })

  it('creates an academy and navigates to its detail page', async () => {
    const user = userEvent.setup()
    create.mockImplementation((_body, o) => o.onSuccess({ id: 'a9' }))
    renderWithProviders(<AcademyCreatePage />)

    await fill(user)
    await user.click(screen.getByRole('button', { name: 'New Academy' }))

    expect(create).toHaveBeenCalledWith({ name: 'Evolution', address: 'Rua X' }, expect.anything())
    expect(navigate).toHaveBeenCalledWith('/academies/a9')
  })

  it('shows an error message when creation fails', async () => {
    const user = userEvent.setup()
    create.mockImplementation((_body, o) => o.onError())
    renderWithProviders(<AcademyCreatePage />)

    await fill(user)
    await user.click(screen.getByRole('button', { name: 'New Academy' }))

    expect(screen.getByText('Failed to create academy.')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
