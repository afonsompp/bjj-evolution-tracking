import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const trainingsState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const { deleteMutate } = vi.hoisted(() => ({ deleteMutate: vi.fn() }))

vi.mock('../features/training/hooks/useTrainings', () => ({ useTrainings: () => trainingsState.value }))
vi.mock('../features/training/hooks/useManageTraining', () => ({
  useDeleteTraining: () => ({ mutate: deleteMutate, isPending: false }),
}))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import HistoryPage from './HistoryPage'

const training = {
  id: 1,
  sessionDate: '2026-05-01T19:00:00Z',
  trainingType: 'GI',
  classType: 'REGULAR',
  durationMinutes: 90,
  roundLengthMinutes: 5, restLengthMinutes: 1, totalRolls: 6,
  cardioRating: 3, intensityRating: 4,
  techniques: [], appliedTechniques: [], sufferedTechniques: [],
  sweeps: 0, takedowns: 0, guardPasses: 0, submissions: 0, taps: 0, escapes: 0,
  description: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  trainingsState.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
})

describe('HistoryPage', () => {
  it('shows the empty state with no sessions', () => {
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('No training logs yet')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    trainingsState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('Failed to load training history.')).toBeInTheDocument()
  })

  it('lists training sessions with the total count', () => {
    trainingsState.value = {
      data: { content: [training], totalElements: 1, totalPages: 1 },
      isLoading: false, isError: false,
    }
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('1 sessions')).toBeInTheDocument()
    expect(screen.getByText('Regular')).toBeInTheDocument()
  })

  it('navigates to the new-training form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HistoryPage />)
    await user.click(screen.getByRole('button', { name: 'New Training' }))
    expect(navigate).toHaveBeenCalledWith('/training/new')
  })

  it('deletes a session through the confirmation modal', async () => {
    const user = userEvent.setup()
    trainingsState.value = {
      data: { content: [training], totalElements: 1, totalPages: 1 },
      isLoading: false, isError: false,
    }
    renderWithProviders(<HistoryPage />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Delete Training')).toBeInTheDocument()

    // Card delete (icon) + modal confirm both read "Delete"; the modal's is last.
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[deleteButtons.length - 1])
    expect(deleteMutate).toHaveBeenCalledWith(1, expect.anything())
  })
})
