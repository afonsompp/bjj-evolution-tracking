import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const academyState = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean } }))
const updateState = vi.hoisted(() => ({
  value: {} as { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isSuccess: boolean; isError: boolean },
}))
vi.mock('../hooks/useAcademy', () => ({ useAcademy: () => academyState.value }))
vi.mock('../hooks/useUpdateAcademy', () => ({ useUpdateAcademy: () => updateState.value }))

import { SettingsSection } from './SettingsSection'

const mutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  academyState.value = {
    data: { id: 'a1', name: 'Evolution Academy', address: 'Rua das Flores, 123' },
    isLoading: false,
  }
  updateState.value = { mutate, isPending: false, isSuccess: false, isError: false }
})

const byName = (c: HTMLElement, n: string) => c.querySelector(`[name="${n}"]`) as HTMLInputElement

describe('SettingsSection', () => {
  it('shows a spinner while loading', () => {
    academyState.value = { data: undefined, isLoading: true }
    const { container } = renderWithProviders(<SettingsSection academyId="a1" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('populates the form from the fetched academy', async () => {
    const { container } = renderWithProviders(<SettingsSection academyId="a1" />)
    await waitFor(() => expect(byName(container, 'name').value).toBe('Evolution Academy'))
    expect(byName(container, 'address').value).toBe('Rua das Flores, 123')
  })

  it('keeps Save disabled until a field changes, then submits the new values', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<SettingsSection academyId="a1" />)
    await waitFor(() => expect(byName(container, 'name').value).toBe('Evolution Academy'))

    const save = screen.getByRole('button', { name: 'Save changes' })
    expect(save).toBeDisabled()

    await user.clear(byName(container, 'name'))
    await user.type(byName(container, 'name'), 'Evolution HQ')
    expect(save).toBeEnabled()

    await user.click(save)
    expect(mutate).toHaveBeenCalledWith({ name: 'Evolution HQ', address: 'Rua das Flores, 123' })
  })

  it('shows a saved confirmation on success', () => {
    updateState.value = { mutate, isPending: false, isSuccess: true, isError: false }
    renderWithProviders(<SettingsSection academyId="a1" />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('shows an error message on failure', () => {
    updateState.value = { mutate, isPending: false, isSuccess: false, isError: true }
    renderWithProviders(<SettingsSection academyId="a1" />)
    expect(screen.getByText('Failed to save changes.')).toBeInTheDocument()
  })
})
