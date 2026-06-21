import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReceiptConfirm from './ReceiptConfirm'

const sampleItems = [
  { name: 'Chicken breast', price_inr: 300, category: 'poultry_eggs' },
  { name: 'Spinach', price_inr: 50, category: 'produce' },
]

describe('ReceiptConfirm', () => {
  it('renders all extracted items', () => {
    render(<ReceiptConfirm items={sampleItems} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Chicken breast')).toBeInTheDocument()
    expect(screen.getByText('Spinach')).toBeInTheDocument()
  })

  it('excludes an unchecked item from the confirmed list', () => {
    const onConfirm = vi.fn()
    render(<ReceiptConfirm items={sampleItems} onConfirm={onConfirm} onCancel={vi.fn()} />)

    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]
    expect(firstCheckbox).toBeDefined()
    fireEvent.click(firstCheckbox!)

    fireEvent.click(screen.getByText('Confirm all'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const confirmedItems = onConfirm.mock.calls[0]?.[0]
    expect(confirmedItems).toBeDefined()
    expect(confirmedItems).toHaveLength(1)
    expect(confirmedItems[0].name).toBe('Spinach')
  })

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<ReceiptConfirm items={sampleItems} onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('confirms all items by default when nothing is unchecked', () => {
    const onConfirm = vi.fn()
    render(<ReceiptConfirm items={sampleItems} onConfirm={onConfirm} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByText('Confirm all'))
    const confirmedItems = onConfirm.mock.calls[0]?.[0]
    expect(confirmedItems).toHaveLength(2)
  })
})
