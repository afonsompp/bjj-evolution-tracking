import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import type { TechniqueType } from '../../../types/api'

type Tech = { id: number; name: string; type: TechniqueType }

const state = vi.hoisted(() => ({
  value: {} as {
    data: { pages: { content: Tech[]; totalElements: number; last: boolean; number: number }[] }
    fetchNextPage: () => void
    hasNextPage: boolean
    isFetchingNextPage: boolean
    isLoading: boolean
    isFetching: boolean
  },
}))
vi.mock('../hooks/useTechniques', () => ({ useTechniqueSearch: () => state.value }))

import { TechniquePicker } from './TechniquePicker'

const TECHNIQUES: Tech[] = [
  { id: 1, name: 'Armbar', type: 'SUBMISSION' },
  { id: 2, name: 'Triangle', type: 'SUBMISSION' },
  { id: 3, name: 'Mount', type: 'POSITION' },
]

beforeEach(() => {
  state.value = {
    data: { pages: [{ content: TECHNIQUES, totalElements: 3, last: true, number: 0 }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isFetching: false,
  }
})

describe('TechniquePicker', () => {
  it('renders techniques grouped under their translated type headings', () => {
    renderWithProviders(
      <TechniquePicker selectedIds={[]} onChange={vi.fn()} label="Techniques" />,
    )
    expect(screen.getByText('Submissions')).toBeInTheDocument()
    expect(screen.getByText('Positions')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Armbar' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mount' })).toBeInTheDocument()
  })

  it('reflects the current selection via aria-checked', () => {
    renderWithProviders(
      <TechniquePicker selectedIds={[1]} onChange={vi.fn()} label="Techniques" />,
    )
    expect(screen.getByRole('checkbox', { name: 'Armbar' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Triangle' })).not.toBeChecked()
  })

  it('adds a technique to the selection when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <TechniquePicker selectedIds={[]} onChange={onChange} label="Techniques" />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Armbar' }))
    expect(onChange).toHaveBeenCalledWith([1])
  })

  it('removes an already-selected technique when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <TechniquePicker selectedIds={[1, 2]} onChange={onChange} label="Techniques" />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Armbar' }))
    expect(onChange).toHaveBeenCalledWith([2])
  })

  it('selects every technique in a group via its group toggle', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <TechniquePicker selectedIds={[]} onChange={onChange} label="Techniques" />,
    )
    // The only plain buttons are the per-group toggles; SUBMISSION renders first.
    const groupToggles = screen.getAllByRole('button')
    await user.click(groupToggles[0])
    expect(onChange).toHaveBeenCalledWith([1, 2])
  })

  it('honours typeFilter, hiding groups outside the filter', () => {
    renderWithProviders(
      <TechniquePicker
        selectedIds={[]}
        onChange={vi.fn()}
        label="Techniques"
        typeFilter={['SUBMISSION']}
      />,
    )
    expect(screen.getByText('Submissions')).toBeInTheDocument()
    expect(screen.queryByText('Positions')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Mount' })).not.toBeInTheDocument()
  })

  it('shows the empty state when there are no techniques', () => {
    state.value = { ...state.value, data: { pages: [{ content: [], totalElements: 0, last: true, number: 0 }] } }
    renderWithProviders(
      <TechniquePicker selectedIds={[]} onChange={vi.fn()} label="Techniques" />,
    )
    expect(screen.getByText('No techniques available.')).toBeInTheDocument()
  })
})
