import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryChip, CATEGORY_META, CategoryKey } from './CategoryChip'

// Stub out lucide-react icons so Jest doesn't hit the React dual-instance
// issue caused by lucide-react loading its own React copy from the root
// node_modules. The chip's behaviour (labels, colours, aria, clicks) is
// what matters here — not which specific SVG is rendered.
jest.mock('lucide-react', () => ({
  House:           () => <svg data-testid="icon" />,
  TreePine:        () => <svg data-testid="icon" />,
  Dumbbell:        () => <svg data-testid="icon" />,
  Flower2:         () => <svg data-testid="icon" />,
  PartyPopper:     () => <svg data-testid="icon" />,
  Palette:         () => <svg data-testid="icon" />,
  UtensilsCrossed: () => <svg data-testid="icon" />,
}))

describe('CategoryChip', () => {
  it('renders the label from CATEGORY_META', () => {
    render(<CategoryChip category="indoor" />)
    expect(screen.getByText('Indoor')).toBeInTheDocument()
  })

  it('sets aria-pressed="false" when not selected', () => {
    render(<CategoryChip category="sport" selected={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets aria-pressed="true" when selected', () => {
    render(<CategoryChip category="sport" selected />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies the category background color when selected', () => {
    const color = CATEGORY_META.party.color
    render(<CategoryChip category="party" selected />)
    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: color })
  })

  it('does not apply a background color style when not selected', () => {
    render(<CategoryChip category="party" selected={false} />)
    expect(screen.getByRole('button')).not.toHaveStyle({ backgroundColor: CATEGORY_META.party.color })
  })

  it('calls onClick when the chip is clicked', () => {
    const handler = jest.fn()
    render(<CategoryChip category="food" onClick={handler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('renders correctly for every defined category key', () => {
    const keys = Object.keys(CATEGORY_META) as CategoryKey[]
    keys.forEach(key => {
      const { unmount } = render(<CategoryChip category={key} />)
      expect(screen.getByText(CATEGORY_META[key].label)).toBeInTheDocument()
      unmount()
    })
  })
})

describe('CATEGORY_META', () => {
  it('defines label and color for every category key', () => {
    const expectedKeys: CategoryKey[] = ['indoor', 'outdoor', 'sport', 'relaxation', 'party', 'culture', 'food']
    expectedKeys.forEach(key => {
      expect(CATEGORY_META[key]).toHaveProperty('label')
      expect(CATEGORY_META[key]).toHaveProperty('color')
    })
  })
})
