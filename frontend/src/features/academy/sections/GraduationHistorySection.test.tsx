import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/renderWithProviders'

const academyG = vi.hoisted(() => ({ value: {} as { data: unknown; isLoading: boolean; isError: boolean } }))
const emptyResult = { data: undefined, isLoading: false, isError: false }
vi.mock('../hooks/useGraduationHistory', () => ({
  useAcademyGraduations: () => academyG.value,
  useMyGraduations: () => emptyResult,
  useMyAllGraduations: () => emptyResult,
}))

import { GraduationHistorySection } from './GraduationHistorySection'

const grad = {
  id: 'g1',
  student: { name: 'Ana', secondName: 'Silva', nickname: 'aninha' },
  promotedBy: { name: 'Coach', secondName: null },
  graduationDate: '2026-05-01',
  oldBelt: 'WHITE',
  oldStripe: 4,
  newBelt: 'BLUE',
  newStripe: 0,
  academyName: 'Evolution',
}

beforeEach(() => {
  vi.clearAllMocks()
  academyG.value = { data: undefined, isLoading: false, isError: false }
})

describe('GraduationHistorySection (academy variant)', () => {
  it('shows a spinner while loading', () => {
    academyG.value = { data: undefined, isLoading: true, isError: false }
    const { container } = renderWithProviders(<GraduationHistorySection variant="academy" academyId="a1" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an error message on failure', () => {
    academyG.value = { data: undefined, isLoading: false, isError: true }
    renderWithProviders(<GraduationHistorySection variant="academy" academyId="a1" />)
    expect(screen.getByText('Failed to load graduation history.')).toBeInTheDocument()
  })

  it('shows the empty state when there are no graduations', () => {
    academyG.value = { data: { content: [], totalElements: 0, totalPages: 0 }, isLoading: false, isError: false }
    renderWithProviders(<GraduationHistorySection variant="academy" academyId="a1" />)
    expect(screen.getByText('No graduations recorded yet.')).toBeInTheDocument()
  })

  it('renders graduations with student name, belt transition and total badge', () => {
    academyG.value = {
      data: { content: [grad], totalElements: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    }
    renderWithProviders(<GraduationHistorySection variant="academy" academyId="a1" />)

    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('@aninha')).toBeInTheDocument()
    // belt transition: "White · 4" → "Blue"
    expect(screen.getByText('White · 4')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
