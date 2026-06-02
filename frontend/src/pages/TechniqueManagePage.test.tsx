import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'

const techState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const { deleteMutate } = vi.hoisted(() => ({ deleteMutate: vi.fn() }))

vi.mock('../features/technique/hooks/useTechniques', () => ({ useTechniques: () => techState.value }))
vi.mock('../features/technique/hooks/useManageTechnique', () => ({
  useCreateTechnique: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTechnique: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTechnique: () => ({ mutate: deleteMutate, isPending: false }),
}))

import TechniqueManagePage from './TechniqueManagePage'

const technique = { id: 7, name: 'Armbar', type: 'SUBMISSION', target: 'ARM' }

beforeEach(() => {
  vi.clearAllMocks()
  techState.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
})

describe('TechniqueManagePage', () => {
  it('renders the header title', () => {
    renderWithProviders(<TechniqueManagePage />)
    expect(screen.getByRole('heading', { name: 'Manage Techniques' })).toBeInTheDocument()
  })

  it('shows the empty state', () => {
    renderWithProviders(<TechniqueManagePage />)
    expect(screen.getByText('No techniques yet')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    techState.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<TechniqueManagePage />)
    expect(screen.getByText('Failed to load techniques. Try again later.')).toBeInTheDocument()
  })

  it('lists techniques with type and target', () => {
    techState.value = { data: { content: [technique], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<TechniqueManagePage />)
    expect(screen.getByText('Armbar')).toBeInTheDocument()
    expect(screen.getByText('Submission')).toBeInTheDocument()
    expect(screen.getByText('Arm')).toBeInTheDocument()
  })

  it('opens the create modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TechniqueManagePage />)
    await user.click(screen.getByRole('button', { name: 'New Technique' }))
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('deletes a technique through the confirmation modal', async () => {
    const user = userEvent.setup()
    techState.value = { data: { content: [technique], totalElements: 1, totalPages: 1 }, isLoading: false, isError: false }
    renderWithProviders(<TechniqueManagePage />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Delete Technique')).toBeInTheDocument()

    // Row delete (icon) + modal confirm both read "Delete"; the modal's is last.
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[deleteButtons.length - 1])
    expect(deleteMutate).toHaveBeenCalledWith(7, expect.anything())
  })
})
