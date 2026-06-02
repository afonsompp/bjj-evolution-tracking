import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import AuthLayout from './AuthLayout'

describe('AuthLayout', () => {
  it('renders the brand chrome and current year', () => {
    renderWithProviders(<AuthLayout />)
    expect(screen.getByRole('heading', { name: 'BJJ Evolution' })).toBeInTheDocument()
    expect(screen.getByText('Track your jiu-jitsu journey')).toBeInTheDocument()
    expect(
      screen.getByText(`© ${new Date().getFullYear()} BJJ Evolution`),
    ).toBeInTheDocument()
  })

  it('toggles the color theme', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthLayout />)

    // Default (matchMedia stubbed to no match) is light mode.
    const toggle = screen.getByRole('button', { name: 'Dark mode' })
    await user.click(toggle)

    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Light mode' })).toBeInTheDocument()
  })
})
