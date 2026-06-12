import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import { createRef } from 'react'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('text-white')
  })

  it('applies secondary variant classes when variant="secondary"', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-surface')
    expect(btn).toHaveClass('text-ink')
    expect(btn).not.toHaveClass('bg-primary')
  })

  it('passes disabled attribute and prevents pointer events', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveClass('disabled:opacity-50')
  })

  it('fires onClick when clicked', () => {
    const handler = jest.fn()
    render(<Button onClick={handler}>Fire</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', () => {
    const handler = jest.fn()
    render(<Button disabled onClick={handler}>Disabled</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref test</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('merges additional className with base classes', () => {
    render(<Button className="custom-class">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
