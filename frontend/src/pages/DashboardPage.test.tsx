import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const dashState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
vi.mock('../features/dashboard/hooks/useDashboard', () => ({ useDashboard: () => dashState.value }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import DashboardPage from './DashboardPage'

const metrics = {
  current: {
    totalSessions: 12, totalMinutes: 600, totalRolls: 30, totalSubmissions: 9,
    totalTaps: 4, totalEscapes: 6, totalTakedowns: 5, totalGuardPasses: 7, totalSweeps: 3,
    avgCardioRating: 3.5, avgIntensityRating: 4,
  },
  previous: {
    totalSessions: 10, totalMinutes: 500, totalRolls: 25, totalSubmissions: 6,
    totalTaps: 5, totalEscapes: 4, totalTakedowns: 4, totalGuardPasses: 5, totalSweeps: 2,
    avgCardioRating: 3, avgIntensityRating: 3.5,
  },
  topAttacks: [{ name: 'Armbar', count: 5, percentage: 80 }],
  topDefenses: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  dashState.value = { data: metrics, isLoading: false }
})

describe('DashboardPage', () => {
  it('shows the loading placeholder', () => {
    dashState.value = { data: undefined, isLoading: true }
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument()
  })

  it('renders the header, period subtitle and a stat', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Overview of the last 30 days')).toBeInTheDocument()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Armbar')).toBeInTheDocument()
  })

  it('navigates to the new-training form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DashboardPage />)
    await user.click(screen.getByRole('button', { name: 'New Training' }))
    expect(navigate).toHaveBeenCalledWith('/training/new')
  })

  it('updates the period when a new window is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DashboardPage />)
    await user.selectOptions(screen.getByRole('combobox'), '7')
    expect(screen.getByText('Overview of the last 7 days')).toBeInTheDocument()
  })
})
