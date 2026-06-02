import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AcademyMembersPage from './AcademyMembersPage'

describe('AcademyMembersPage', () => {
  it('redirects to the academy detail page on the members tab', () => {
    render(
      <MemoryRouter initialEntries={['/academies/a1/members']}>
        <Routes>
          <Route path="/academies/:id/members" element={<AcademyMembersPage />} />
          <Route path="/academies/:id" element={<div>academy detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    // The query string (?tab=members) is preserved but doesn't affect matching.
    expect(screen.getByText('academy detail')).toBeInTheDocument()
  })
})
