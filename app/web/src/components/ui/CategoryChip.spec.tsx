import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryChip, CATEGORY_META, CategoryKey } from './CategoryChip'

describe('CategoryChip', () => {
  it('renders the label and emoji from CATEGORY_META', () => {
    render(<CategoryChip category="indoor" />)
    expect(screen.getByText('Indoor')).toBeInTheDocument()
    expect(screen.getByText('🏠')).toBeInTheDocument()
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
  it('defines label, emoji, and color for every category key', () => {
    const expectedKeys: CategoryKey[] = ['indoor', 'outdoor', 'sport', 'relaxation', 'party', 'culture', 'food']
    expectedKeys.forEach(key => {
      expect(CATEGORY_META[key]).toHaveProperty('label')
      expect(CATEGORY_META[key]).toHaveProperty('emoji')
      expect(CATEGORY_META[key]).toHaveProperty('color')
    })
  })
})
