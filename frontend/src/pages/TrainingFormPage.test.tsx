import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const profileState = vi.hoisted(() => ({ value: {} as { data: unknown; isError: boolean } }))
const trainingState = vi.hoisted(() => ({ value: { data: undefined as unknown } }))
const mut = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))

vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))
vi.mock('../features/training/hooks/useTrainings', () => ({ useTraining: () => trainingState.value }))
vi.mock('../features/training/hooks/useManageTraining', () => ({
  useCreateTraining: () => ({ mutate: mut.create, isPending: false }),
  useUpdateTraining: () => ({ mutate: mut.update, isPending: false }),
}))
vi.mock('../features/technique/hooks/useManageTechnique', () => ({
  useCreateTechnique: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../features/technique/components/TechniquePicker', () => ({ TechniquePicker: () => <div>technique-picker</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import TrainingFormPage from './TrainingFormPage'

const existingTraining = {
  id: 5,
  sessionDate: '2026-05-01T19:00:00Z',
  trainingType: 'NO_GI',
  classType: 'COMPETITION',
  durationMinutes: 75,
  roundLengthMinutes: 6,
  restLengthMinutes: 1,
  totalRolls: 5,
  cardioRating: 4,
  intensityRating: 4,
  techniques: [],
  appliedTechniques: [],
  sufferedTechniques: [],
  sweeps: 1, takedowns: 2, guardPasses: 3, submissions: 4, taps: 0, escapes: 1,
  description: 'good session',
}

beforeEach(() => {
  vi.clearAllMocks()
  profileState.value = { data: { role: 'CUSTOMER' }, isError: false }
  trainingState.value = { data: undefined }
})

describe('TrainingFormPage (create)', () => {
  it('renders the new-training title', () => {
    renderWithProviders(<TrainingFormPage />, { path: '/training/new', route: '/training/new' })
    expect(screen.getByRole('heading', { name: 'New Training' })).toBeInTheDocument()
  })

  it('submits with valid defaults and navigates to the training list', async () => {
    const user = userEvent.setup()
    mut.create.mockImplementation((_payload, o) => o.onSuccess())
    renderWithProviders(<TrainingFormPage />, { path: '/training/new', route: '/training/new' })

    await user.click(screen.getByRole('button', { name: 'Save Training' }))

    expect(mut.create).toHaveBeenCalledWith(
      expect.objectContaining({ trainingType: 'GI', classType: 'REGULAR', durationMinutes: 90 }),
      expect.anything(),
    )
    expect(navigate).toHaveBeenCalledWith('/training')
  })

  it('redirects to onboarding when the profile is missing', async () => {
    profileState.value = { data: undefined, isError: true }
    renderWithProviders(<TrainingFormPage />, { path: '/training/new', route: '/training/new' })
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/onboarding', { replace: true }))
  })
})

describe('TrainingFormPage (edit)', () => {
  const opts = { path: '/training/:id/edit', route: '/training/5/edit' }

  it('hydrates from the existing training and updates on submit', async () => {
    const user = userEvent.setup()
    trainingState.value = { data: existingTraining }
    mut.update.mockImplementation((_payload, o) => o.onSuccess())
    renderWithProviders(<TrainingFormPage />, opts)

    expect(screen.getByRole('heading', { name: 'Edit Training' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mut.update).toHaveBeenCalledWith(
      expect.objectContaining({ classType: 'COMPETITION', trainingType: 'NO_GI', durationMinutes: 75 }),
      expect.anything(),
    )
    expect(navigate).toHaveBeenCalledWith('/')
  })
})
