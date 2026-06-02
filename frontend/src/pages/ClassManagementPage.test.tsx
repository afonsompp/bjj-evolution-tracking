import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import ClassManagementPage from './ClassManagementPage'

function Detail() {
  const [sp] = useSearchParams()
  return <div>detail tab={sp.get('tab')} sub={sp.get('sub') ?? 'none'}</div>
}

function renderAt(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/academies/:id/classes" element={<ClassManagementPage />} />
        <Route path="/academies/:id" element={<Detail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ClassManagementPage', () => {
  it('redirects to the academy detail page on the classes tab', () => {
    renderAt('/academies/a1/classes')
    expect(screen.getByText('detail tab=classes sub=none')).toBeInTheDocument()
  })

  it('preserves the templates intent as the classes sub-tab', () => {
    renderAt('/academies/a1/classes?tab=templates')
    expect(screen.getByText('detail tab=classes sub=templates')).toBeInTheDocument()
  })
})
