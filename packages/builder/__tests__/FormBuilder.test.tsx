import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormBuilder } from '../src/FormBuilder'

describe('FormBuilder', () => {
  it('renders the palette and an empty canvas', () => {
    render(<FormBuilder />)
    expect(screen.getByTestId('builder-empty')).toBeTruthy()
    expect(screen.getByTestId('palette-SHORT_TEXT')).toBeTruthy()
  })

  it('adds a field when a palette button is clicked', () => {
    render(<FormBuilder />)
    fireEvent.click(screen.getByTestId('palette-EMAIL'))
    expect(screen.queryByTestId('builder-empty')).toBeNull()
    expect(screen.getByText('EMAIL')).toBeTruthy()
  })

  it('emits config through onChange when fields change', () => {
    const onChange = vi.fn()
    render(<FormBuilder onChange={onChange} />)
    fireEvent.click(screen.getByTestId('palette-NUMBER'))
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.fields).toHaveLength(1)
    expect(lastCall.fields[0].type).toBe('NUMBER')
  })

  it('edits the selected field label via the inspector', () => {
    const onChange = vi.fn()
    render(<FormBuilder onChange={onChange} />)
    fireEvent.click(screen.getByTestId('palette-SHORT_TEXT'))
    const labelInput = screen.getByTestId('prop-label') as HTMLInputElement
    fireEvent.change(labelInput, { target: { value: 'Full Name' } })
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.fields[0].label).toBe('Full Name')
  })

  it('removes a field', () => {
    render(<FormBuilder />)
    fireEvent.click(screen.getByTestId('palette-DATE'))
    const removeBtn = screen.getByLabelText(/Remove/)
    fireEvent.click(removeBtn)
    expect(screen.getByTestId('builder-empty')).toBeTruthy()
  })
})
