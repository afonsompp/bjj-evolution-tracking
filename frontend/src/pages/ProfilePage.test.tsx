import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const profileState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const upsertState = vi.hoisted(() => ({
  value: {} as { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean; isSuccess: boolean; error: unknown },
}))
const uploadState = vi.hoisted(() => ({ value: {} as { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean } }))
const removeState = vi.hoisted(() => ({ value: {} as { mutate: ReturnType<typeof vi.fn>; isPending: boolean } }))

vi.mock('../features/profile/useProfile', () => ({
  useProfile: () => profileState.value,
  useUpsertProfile: () => upsertState.value,
  useUploadPhoto: () => uploadState.value,
  useRemovePhoto: () => removeState.value,
}))
vi.mock('../features/academy/sections/GraduationHistorySection', () => ({ GraduationHistorySection: () => <div>grad-section</div> }))
vi.mock('../features/academy/sections/AttendanceHistorySection', () => ({ AttendanceHistorySection: () => <div>att-section</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import ProfilePage from './ProfilePage'

const upsertMutate = vi.fn()
const uploadMutate = vi.fn()
const removeMutate = vi.fn()
const profile = {
  id: 'u1', name: 'Ana', secondName: 'Silva', nickname: 'aninha',
  belt: 'BLUE', beltStripe: 2, startsIn: '2020-01-01', photoUrl: 'https://x/p.png',
}

beforeEach(() => {
  vi.clearAllMocks()
  profileState.value = { data: profile, isLoading: false, isError: false }
  upsertState.value = { mutate: upsertMutate, isPending: false, isError: false, isSuccess: false, error: null }
  uploadState.value = { mutate: uploadMutate, isPending: false, isError: false }
  removeState.value = { mutate: removeMutate, isPending: false }
})

const byName = (c: HTMLElement, n: string) => c.querySelector(`[name="${n}"]`) as HTMLInputElement

describe('ProfilePage', () => {
  it('shows the loading skeleton', () => {
    profileState.value = { data: undefined, isLoading: true, isError: false }
    renderWithProviders(<ProfilePage />)
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  it('redirects to onboarding when the profile fails to load', async () => {
    profileState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<ProfilePage />)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/onboarding', { replace: true }))
  })

  it('renders the form populated from the profile', () => {
    const { container } = renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('heading', { name: 'Edit Profile' })).toBeInTheDocument()
    expect(byName(container, 'name').value).toBe('Ana')
    expect(byName(container, 'nickname').value).toBe('aninha')
    expect(byName(container, 'belt').value).toBe('BLUE')
  })

  it('submits the profile update', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(upsertMutate).toHaveBeenCalledTimes(1))
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({ name: 'Ana', nickname: 'aninha', belt: 'BLUE', beltStripe: 2 })
  })

  it('uploads a new photo', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<ProfilePage />)
    const file = new File(['x'], 'p.png', { type: 'image/png' })
    await user.upload(container.querySelector('input[type="file"]')!, file)
    expect(uploadMutate).toHaveBeenCalledWith(file)
  })

  it('removes the current photo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(removeMutate).toHaveBeenCalled()
  })

  it('shows a saved confirmation on success', () => {
    upsertState.value = { mutate: upsertMutate, isPending: false, isError: false, isSuccess: true, error: null }
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Profile saved!')).toBeInTheDocument()
  })
})
