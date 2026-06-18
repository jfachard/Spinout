import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

import { usePathname } from 'next/navigation'
const mockUsePathname = usePathname as jest.Mock

describe('Navbar', () => {
  it('shows only the Home nav item when on the home page', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lobby' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Game' })).not.toBeInTheDocument()
  })

  it('shows session nav items (Lobby, Game, History) when on a session route', () => {
    mockUsePathname.mockReturnValue('/session/ABC123/lobby')
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Lobby' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Game' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'History' })).toBeInTheDocument()
  })

  it('extracts the session code and builds correct hrefs', () => {
    mockUsePathname.mockReturnValue('/session/XYZ789/game')
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Lobby' })).toHaveAttribute('href', '/session/XYZ789/lobby')
    expect(screen.getByRole('link', { name: 'Game' })).toHaveAttribute('href', '/session/XYZ789/game')
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/session/XYZ789/history')
  })

  it('marks the active Home link when on the root path', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Navbar />)
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).toHaveClass('bg-ink')
  })

  it('marks the active session sub-route link', () => {
    mockUsePathname.mockReturnValue('/session/ABC/game')
    render(<Navbar />)
    const gameLink = screen.getByRole('link', { name: 'Game' })
    expect(gameLink).toHaveClass('bg-ink')
    const lobbyLink = screen.getByRole('link', { name: 'Lobby' })
    expect(lobbyLink).not.toHaveClass('bg-ink')
  })

  it('renders the Spinout logo and brand name', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Navbar />)
    expect(screen.getByAltText('Spinout')).toBeInTheDocument()
    expect(screen.getByText('Spinout')).toBeInTheDocument()
  })
})
