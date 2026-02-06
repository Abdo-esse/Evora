import { render, screen } from '@testing-library/react'
import StatusBadge from '../status-badge'
import { EventStatus, ReservationStatus } from '@/lib/types'

describe('StatusBadge', () => {
    it('renders correctly for PUBLISHED status', () => {
        render(<StatusBadge status={EventStatus.PUBLISHED} />)
        expect(screen.getByText(/Published/i)).toBeInTheDocument()
    })

    it('renders correctly for CANCELED status', () => {
        render(<StatusBadge status={EventStatus.CANCELED} />)
        expect(screen.getByText(/Canceled/i)).toBeInTheDocument()
    })

    it('renders correctly for PENDING reservation status', () => {
        render(<StatusBadge status={ReservationStatus.PENDING} />)
        expect(screen.getByText(/Pending/i)).toBeInTheDocument()
    })
})
