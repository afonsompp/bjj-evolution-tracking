import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders the photo as an <img> with the name as alt text', () => {
    render(<Avatar photoUrl="https://x/p.png" name="Afonso" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://x/p.png')
    expect(img).toHaveAttribute('alt', 'Afonso')
  })

  it('falls back to the user icon (no <img>) when there is no photo', () => {
    render(<Avatar name="Afonso" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('applies the given size to the wrapper', () => {
    const { container } = render(<Avatar photoUrl="https://x/p.png" size={72} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ width: '72px', height: '72px' })
  })

  it('uses an empty alt when no name is given (decorative photo)', () => {
    const { container } = render(<Avatar photoUrl="https://x/p.png" />)
    // An empty alt makes the <img> presentational, so query the DOM directly.
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })
})
