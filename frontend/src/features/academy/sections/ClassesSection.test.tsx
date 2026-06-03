import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const classesState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const templatesState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))

vi.mock('../hooks/useClasses', () => ({ useClasses: () => classesState.value }))
vi.mock('../hooks/useTemplates', () => ({ useTemplates: () => templatesState.value }))
const updateMut = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('../hooks/useClassMutations', () => ({
  useCancelClass: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateClass: () => ({ mutate: updateMut.mutate, isPending: false }),
}))
const genMut = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('../hooks/useTemplateMutations', () => ({
  useDeleteTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateFromTemplate: () => ({ mutate: genMut.mutate, isPending: false }),
}))
vi.mock('../components/ClassDetailsPanel', () => ({
  ClassDetailsPanel: ({ cls }: { cls: { id: number } }) => <div>class-details-{cls.id}</div>,
}))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import { ClassesSection } from './ClassesSection'

const scheduledClass = {
  id: 5,
  academyId: 'a1',
  classType: 'REGULAR',
  trainingType: 'GI',
  status: 'PUBLISHED',
  startTime: '2026-06-01T19:00:00Z',
  durationMinutes: 60,
  instructor: { id: 'i1', name: 'Coach' },
  scheduledTechniques: [],
}

const draftClass = { ...scheduledClass, id: 6, status: 'DRAFT' }

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

  it('expands a class row to reveal its details panel', async () => {
    const user = userEvent.setup()
    classesState.value = { data: { content: [scheduledClass], totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<ClassesSection academyId="a1" />)

    expect(screen.queryByText('class-details-5')).not.toBeInTheDocument()
    await user.click(screen.getByText(/Regular · GI/))
    expect(screen.getByText('class-details-5')).toBeInTheDocument()
  })

  it('shows a Publish shortcut only for draft classes and publishes with status PUBLISHED', async () => {
    const user = userEvent.setup()
    classesState.value = { data: { content: [draftClass], totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<ClassesSection academyId="a1" />)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(updateMut.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: 6,
        body: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
      expect.anything(),
    )
  })

  it('does not show a Publish shortcut for a published class', () => {
    classesState.value = { data: { content: [scheduledClass], totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<ClassesSection academyId="a1" />)
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
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

  it('opens directly on the templates view when ?sub=templates is set', () => {
    renderWithProviders(<ClassesSection academyId="a1" />, { route: '/?sub=templates' })
    expect(screen.getByText('No templates yet')).toBeInTheDocument()
  })

  it('generates classes with the chosen draft status', async () => {
    const user = userEvent.setup()
    templatesState.value = {
      data: {
        content: [
          {
            id: 't1',
            name: 'Weekly Fundamentals',
            instructor: { id: 'i1', name: 'Coach' },
            durationMinutes: 60,
            classType: 'REGULAR',
            trainingType: 'GI',
            techniques: [],
            recurrenceRules: [{ dayOfWeek: 'MONDAY', startTime: '19:00:00' }],
          },
        ],
      },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<ClassesSection academyId="a1" />)

    await user.click(screen.getByRole('button', { name: 'Templates' }))
    await user.click(screen.getByRole('button', { name: 'Generate Classes' }))

    await user.selectOptions(screen.getByRole('combobox'), 'DRAFT')
    const confirmButtons = screen.getAllByRole('button', { name: 'Generate Classes' })
    await user.click(confirmButtons[confirmButtons.length - 1])

    expect(genMut.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 't1',
        body: expect.objectContaining({ status: 'DRAFT' }),
      }),
      expect.anything(),
    )
  })
})
