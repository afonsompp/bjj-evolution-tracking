import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AcademySettingsPage from './AcademySettingsPage'

describe('AcademySettingsPage', () => {
  it('redirects to the academy detail page on the settings tab', () => {
    render(
      <MemoryRouter initialEntries={['/academies/a1/settings']}>
        <Routes>
          <Route path="/academies/:id/settings" element={<AcademySettingsPage />} />
          <Route path="/academies/:id" element={<div>academy detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('academy detail')).toBeInTheDocument()
  })
})
