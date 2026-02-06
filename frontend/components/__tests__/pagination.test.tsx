import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../pagination'

describe('Pagination', () => {
    const onPageChange = jest.fn()

    beforeEach(() => {
        onPageChange.mockClear()
    })

    it('renders nothing if totalPages is 1', () => {
        const { container } = render(
            <Pagination page={1} totalPages={1} onPageChange={onPageChange} />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('renders correctly and handles interactions', () => {
        render(
            <Pagination page={1} totalPages={5} onPageChange={onPageChange} />
        )

        expect(screen.getByText(/Page 1 of 5/i)).toBeInTheDocument()

        const nextButton = screen.getByRole('button', { name: /next/i })
        fireEvent.click(nextButton)
        expect(onPageChange).toHaveBeenCalledWith(2)

        const prevButton = screen.getByRole('button', { name: /previous/i })
        expect(prevButton).toBeDisabled()
    })

    it('enables previous button on page 2', () => {
        render(
            <Pagination page={2} totalPages={5} onPageChange={onPageChange} />
        )

        const prevButton = screen.getByRole('button', { name: /previous/i })
        expect(prevButton).not.toBeDisabled()
        fireEvent.click(prevButton)
        expect(onPageChange).toHaveBeenCalledWith(1)
    })
})
