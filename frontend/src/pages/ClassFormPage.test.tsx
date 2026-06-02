import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const membersState = vi.hoisted(() => ({ value: { data: { content: [] as unknown[] } } }))
const classState = vi.hoisted(() => ({ value: { data: undefined as unknown } }))
const mut = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))

vi.mock('../features/academy/hooks/useAcademyMembers', () => ({ useAcademyMembers: () => membersState.value }))
vi.mock('../features/academy/hooks/useClasses', () => ({ useClass: () => classState.value }))
vi.mock('../features/academy/hooks/useClassMutations', () => ({
  useCreateClass: () => ({ mutate: mut.create, isPending: false }),
  useUpdateClass: () => ({ mutate: mut.update, isPending: false }),
}))
vi.mock('../features/technique/components/TechniquePicker', () => ({ TechniquePicker: () => <div>technique-picker</div> }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import ClassFormPage from './ClassFormPage'

const instructorMember = { user: { id: 'inst-1', name: 'Coach', secondName: null }, role: 'OWNER' }

beforeEach(() => {
  vi.clearAllMocks()
  membersState.value = { data: { content: [instructorMember] } }
  classState.value = { data: undefined }
})

describe('ClassFormPage (create)', () => {
  const opts = { path: '/academies/:id/classes/new', route: '/academies/a1/classes/new' }

  it('renders the new-class title', () => {
    renderWithProviders(<ClassFormPage />, opts)
    expect(screen.getByRole('heading', { name: 'New Class' })).toBeInTheDocument()
  })

  it('submits a new class and navigates back to the list', async () => {
    const user = userEvent.setup()
    mut.create.mockImplementation((_body, o) => o.onSuccess())
    const { container } = renderWithProviders(<ClassFormPage />, opts)

    const selects = container.querySelectorAll('select')
    await user.selectOptions(selects[0], 'inst-1') // instructor
    fireEvent.change(container.querySelector('input[type="datetime-local"]')!, {
      target: { value: '2026-06-01T19:00' },
    })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mut.create).toHaveBeenCalledWith(
      expect.objectContaining({
        academyId: 'a1',
        instructorId: 'inst-1',
        classType: 'REGULAR',
        trainingType: 'GI',
        status: 'PUBLISHED',
      }),
      expect.anything(),
    )
    expect(navigate).toHaveBeenCalledWith('/academies/a1/classes')
  })
})

describe('ClassFormPage (edit)', () => {
  const opts = { path: '/academies/:id/classes/:classId/edit', route: '/academies/a1/classes/5/edit' }

  it('hydrates from the existing class and updates on submit', async () => {
    const user = userEvent.setup()
    classState.value = {
      data: {
        id: 5,
        instructor: { id: 'inst-1' },
        startTime: '2026-06-01T19:00:00Z',
        durationMinutes: 90,
        classType: 'PRIVATE',
        trainingType: 'NO_GI',
        status: 'PUBLISHED',
        scheduledTechniques: [],
      },
    }
    mut.update.mockImplementation((_args, o) => o.onSuccess())
    renderWithProviders(<ClassFormPage />, opts)

    expect(screen.getByRole('heading', { name: 'Edit Class' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mut.update).toHaveBeenCalledWith(
      expect.objectContaining({ classId: 5, body: expect.objectContaining({ classType: 'PRIVATE' }) }),
      expect.anything(),
    )
    expect(navigate).toHaveBeenCalledWith('/academies/a1/classes')
  })
})
