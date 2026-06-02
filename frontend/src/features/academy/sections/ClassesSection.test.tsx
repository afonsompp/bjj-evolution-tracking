import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const classesState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const templatesState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))

vi.mock('../hooks/useClasses', () => ({ useClasses: () => classesState.value }))
vi.mock('../hooks/useTemplates', () => ({ useTemplates: () => templatesState.value }))
vi.mock('../hooks/useClassMutations', () => ({ useCancelClass: () => ({ mutate: vi.fn(), isPending: false }) }))
vi.mock('../hooks/useTemplateMutations', () => ({
  useDeleteTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateFromTemplate: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../components/AttendanceModal', () => ({ AttendanceModal: () => <div>attendance-modal</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import { ClassesSection } from './ClassesSection'

const scheduledClass = {
  id: 5,
  classType: 'REGULAR',
  trainingType: 'GI',
  status: 'PUBLISHED',
  startTime: '2026-06-01T19:00:00Z',
  durationMinutes: 60,
  instructor: { id: 'i1', name: 'Coach' },
}

beforeEach(() => {
  vi.clearAllMocks()
  classesState.value = { data: { content: [], totalPages: 0 }, isLoading: false, isError: false }
  templatesState.value = { data: { content: [] }, isLoading: false, isError: false }
})

describe('ClassesSection', () => {
  it('shows the empty state for the classes tab', () => {
    renderWithProviders(<ClassesSection academyId="a1" />)
    expect(screen.getByText('No classes in this period')).toBeInTheDocument()
  })

  it('renders an error when classes fail to load', () => {
    classesState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<ClassesSection academyId="a1" />)
    expect(screen.getByText('Failed to load classes.')).toBeInTheDocument()
  })

  it('lists classes with type and localized status', () => {
    classesState.value = { data: { content: [scheduledClass], totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<ClassesSection academyId="a1" />)
    expect(screen.getByText(/Regular · GI/)).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('opens the attendance modal for a class', async () => {
    const user = userEvent.setup()
    classesState.value = { data: { content: [scheduledClass], totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<ClassesSection academyId="a1" />)

    expect(screen.queryByText('attendance-modal')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Attendance' }))
    expect(screen.getByText('attendance-modal')).toBeInTheDocument()
  })

  it('navigates to the new-class page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClassesSection academyId="a1" />)
    await user.click(screen.getByRole('button', { name: 'New Class' }))
    expect(navigate).toHaveBeenCalledWith('/academies/a1/classes/new')
  })

  it('switches to the templates tab and shows its empty state', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClassesSection academyId="a1" />)
    await user.click(screen.getByRole('button', { name: 'Templates' }))
    expect(screen.getByText('No templates yet')).toBeInTheDocument()
  })
})
