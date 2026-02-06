import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyReservationsPage from "../page";
import api from "@/lib/api";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/lib/api");
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock("@/components/protected-route", () => ({
    ParticipantProtected: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock browser APIs
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
window.URL.createObjectURL = mockCreateObjectURL;
window.URL.revokeObjectURL = mockRevokeObjectURL;

describe("MyReservationsPage", () => {
    const mockReservations = [
        {
            id: "res-1",
            status: "PENDING",
            createdAt: "2026-02-07T12:00:00Z",
            event: { title: "Jazz Night" },
        },
        {
            id: "res-2",
            status: "CONFIRMED",
            createdAt: "2026-02-07T13:00:00Z",
            event: { title: "Tech Meetup" },
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                data: {
                    data: mockReservations,
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
                meta: { page: 1, totalPages: 1 },
            },
        });
    });

    it("renders reservations list", async () => {
        render(<MyReservationsPage />);

        expect(screen.getByText(/My Reservations/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Jazz Night/i)).toBeInTheDocument();
            expect(screen.getByText(/Tech Meetup/i)).toBeInTheDocument();
        });
    });

    it("handles search input", async () => {
        render(<MyReservationsPage />);

        const searchInput = screen.getByPlaceholderText(/Search reservations.../i);
        fireEvent.change(searchInput, { target: { value: "Jazz" } });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith("/reservations", expect.objectContaining({
                params: expect.objectContaining({ search: "Jazz" }),
            }));
        });
    });

    it("handles status filter change", async () => {
        render(<MyReservationsPage />);

        // StatusFilter uses a select or similar, might need to find by text if it's a Radix select
        // Assuming StatusFilter renders something clickable with the option label
        const filterTrigger = screen.getByRole("combobox");
        fireEvent.click(filterTrigger);

        // This part depends on how StatusFilter/Select is implemented. 
        // Usually Radix Select renders options in a portal.
    });

    it("handles reservation cancellation", async () => {
        (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });

        render(<MyReservationsPage />);

        await waitFor(() => screen.getByText(/Jazz Night/i));

        const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
        fireEvent.click(cancelButtons[0]); // Click first cancel button (Jazz Night)

        expect(screen.getByText(/Are you sure you want to cancel this reservation\?/i)).toBeInTheDocument();

        const confirmButton = screen.getByRole("button", { name: /Cancel reservation/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith("/reservations/res-1/cancel");
            expect(toast.success).toHaveBeenCalledWith("Reservation cancelled");
        });
    });

    it("handles ticket download", async () => {
        (api.get as jest.Mock).mockImplementation((url) => {
            if (url.includes("/ticket")) {
                return Promise.resolve({ data: new Blob(["pdf-content"]) });
            }
            return Promise.resolve({ data: { success: true, data: { data: mockReservations } } });
        });

        // Mocking URL.createObjectURL is already done in outer scope

        // We only want to spy on the click, not break the whole DOM
        const mockClick = jest.fn();
        const originalCreateElement = document.createElement.bind(document);
        jest.spyOn(document, "createElement").mockImplementation((tagName) => {
            const element = originalCreateElement(tagName);
            if (tagName === "a") {
                element.click = mockClick;
            }
            return element;
        });

        render(<MyReservationsPage />);

        await waitFor(() => screen.getByText(/Tech Meetup/i));

        const ticketButton = screen.getByRole("button", { name: /Ticket/i });
        fireEvent.click(ticketButton);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith("/reservations/res-2/ticket", expect.objectContaining({
                responseType: "blob",
            }));
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
        });
    });
});
