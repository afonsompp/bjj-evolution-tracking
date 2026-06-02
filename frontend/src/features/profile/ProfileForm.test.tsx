import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))
const mutationState = vi.hoisted(() => ({ value: { mutate, isPending: false, isError: false, error: null as unknown } }))
vi.mock('./useProfile', () => ({ useUpsertProfile: () => mutationState.value }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import ProfileForm from './ProfileForm'

beforeEach(() => {
  vi.clearAllMocks()
  mutationState.value = { mutate, isPending: false, isError: false, error: null }
})

describe('ProfileForm', () => {
  it('blocks submit and shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileForm />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Nickname is required')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits a normalized ProfileRequest and navigates on success', async () => {
    const user = userEvent.setup()
    // Resolve the mutation by invoking the onSuccess callback it's given.
    mutate.mockImplementation((_body, opts) => opts?.onSuccess?.())
    renderWithProviders(<ProfileForm />)

    await user.type(screen.getByLabelText('Name'), 'Afonso')
    await user.type(screen.getByLabelText('Nickname'), 'fonso')
    await user.selectOptions(screen.getByLabelText('Belt'), 'BLUE')
    await user.type(screen.getByLabelText('Stripe (0–4)'), '2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate.mock.calls[0][0]).toMatchObject({
      name: 'Afonso',
      nickname: 'fonso',
      belt: 'BLUE',
      beltStripe: 2,
    })
    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('shows a saving state while the mutation is pending', () => {
    mutationState.value = { mutate, isPending: true, isError: false, error: null }
    renderWithProviders(<ProfileForm />)
    const button = screen.getByRole('button', { name: 'Saving…' })
    expect(button).toBeDisabled()
  })

  it('renders the backend error message when the mutation fails', () => {
    mutationState.value = {
      mutate,
      isPending: false,
      isError: true,
      error: { isAxiosError: true, response: { data: { message: 'Nickname taken' } } },
    }
    renderWithProviders(<ProfileForm />)
    expect(screen.getByText('Nickname taken')).toBeInTheDocument()
  })
})
