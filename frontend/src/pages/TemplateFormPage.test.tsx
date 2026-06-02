import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const membersState = vi.hoisted(() => ({ value: { data: { content: [] as unknown[] } } }))
const templateState = vi.hoisted(() => ({ value: { data: undefined as unknown } }))
const mut = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))

vi.mock('../features/academy/hooks/useAcademyMembers', () => ({ useAcademyMembers: () => membersState.value }))
vi.mock('../features/academy/hooks/useTemplates', () => ({ useTemplate: () => templateState.value }))
vi.mock('../features/academy/hooks/useTemplateMutations', () => ({
  useCreateTemplate: () => ({ mutate: mut.create, isPending: false }),
  useUpdateTemplate: () => ({ mutate: mut.update, isPending: false }),
}))
vi.mock('../features/technique/components/TechniquePicker', () => ({ TechniquePicker: () => <div>technique-picker</div> }))

const profileState = vi.hoisted(() => ({ value: { data: undefined as unknown } }))
vi.mock('../features/profile/useProfile', () => ({ useProfile: () => profileState.value }))

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}))

import TemplateFormPage from './TemplateFormPage'

const instructorMember = { user: { id: 'inst-1', name: 'Coach', secondName: null }, role: 'OWNER' }

beforeEach(() => {
  vi.clearAllMocks()
  membersState.value = { data: { content: [instructorMember] } }
  templateState.value = { data: undefined }
  profileState.value = { data: { role: 'CUSTOMER' } }
})

describe('TemplateFormPage (create)', () => {
  const opts = { path: '/academies/:id/templates/new', route: '/academies/a1/templates/new' }

  it('renders the new-template title', () => {
    renderWithProviders(<TemplateFormPage />, opts)
    expect(screen.getByRole('heading', { name: 'New Template' })).toBeInTheDocument()
  })

  it('hides the new-technique button for customers and shows it for managers', () => {
    const { rerender } = renderWithProviders(<TemplateFormPage />, opts)
    expect(screen.queryByRole('button', { name: '+ New Technique' })).not.toBeInTheDocument()

    profileState.value = { data: { role: 'PLATFORM_MANAGER' } }
    rerender(<TemplateFormPage />)
    expect(screen.getByRole('button', { name: '+ New Technique' })).toBeInTheDocument()
  })

  it('submits a new template with the default recurrence rule', async () => {
    const user = userEvent.setup()
    mut.create.mockImplementation((_body, o) => o.onSuccess())
    const { container } = renderWithProviders(<TemplateFormPage />, opts)

    await user.type(container.querySelector('input[type="text"]')!, 'Weekly Fundamentals')
    await user.selectOptions(container.querySelectorAll('select')[0], 'inst-1')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mut.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Weekly Fundamentals',
        instructorId: 'inst-1',
        recurrenceRules: [{ dayOfWeek: 'MONDAY', startTime: '19:00:00' }],
      }),
      expect.anything(),
    )
    expect(navigate).toHaveBeenCalledWith('/academies/a1/classes?tab=templates')
  })

  it('adds a recurrence rule row', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<TemplateFormPage />, opts)
    const timeInputsBefore = container.querySelectorAll('input[type="time"]').length
    await user.click(screen.getByRole('button', { name: 'Add Rule' }))
    expect(container.querySelectorAll('input[type="time"]').length).toBe(timeInputsBefore + 1)
  })
})

describe('TemplateFormPage (edit)', () => {
  it('hydrates from the existing template', () => {
    templateState.value = {
      data: {
        id: 't1',
        name: 'Existing Template',
        instructor: { id: 'inst-1' },
        durationMinutes: 60,
        classType: 'REGULAR',
        trainingType: 'GI',
        techniques: [{ id: 7 }],
        recurrenceRules: [{ dayOfWeek: 'TUESDAY', startTime: '18:00:00' }],
      },
    }
    const { container } = renderWithProviders(<TemplateFormPage />, {
      path: '/academies/:id/templates/:templateId/edit',
      route: '/academies/a1/templates/t1/edit',
    })
    expect(screen.getByRole('heading', { name: 'Edit Template' })).toBeInTheDocument()
    expect((container.querySelector('input[type="text"]') as HTMLInputElement).value).toBe('Existing Template')
  })

  it('submits the hydrated technique ids on update', async () => {
    const user = userEvent.setup()
    templateState.value = {
      data: {
        id: 't1',
        name: 'Existing Template',
        instructor: { id: 'inst-1' },
        durationMinutes: 60,
        classType: 'REGULAR',
        trainingType: 'GI',
        techniques: [{ id: 7 }, { id: 9 }],
        recurrenceRules: [{ dayOfWeek: 'TUESDAY', startTime: '18:00:00' }],
      },
    }
    mut.update.mockImplementation((_args, o) => o.onSuccess())
    renderWithProviders(<TemplateFormPage />, {
      path: '/academies/:id/templates/:templateId/edit',
      route: '/academies/a1/templates/t1/edit',
    })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mut.update).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 't1',
        body: expect.objectContaining({ techniqueIds: [7, 9] }),
      }),
      expect.anything(),
    )
  })
})
