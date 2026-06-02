import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClassManagementPage from './ClassManagementPage'

describe('ClassManagementPage', () => {
  it('redirects to the academy detail page on the classes tab', () => {
    render(
      <MemoryRouter initialEntries={['/academies/a1/classes']}>
        <Routes>
          <Route path="/academies/:id/classes" element={<ClassManagementPage />} />
          <Route path="/academies/:id" element={<div>academy detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('academy detail')).toBeInTheDocument()
  })
})
