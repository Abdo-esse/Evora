import { render, screen } from "@testing-library/react";
import EventsPage from "../page";
import { serverFetch } from "@/lib/api-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Mock dependencies
jest.mock("@/lib/api-server");
jest.mock("next/headers");
jest.mock("next/navigation");
jest.mock("@/components/events-list", () => {
    return function MockEventsList({ initialEvents, search }: any) {
        return <div data-testid="events-list">Count: {initialEvents.length}, Search: {search}</div>;
    };
});

describe("EventsPage", () => {
    const mockCookies = {
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (cookies as jest.Mock).mockReturnValue(mockCookies);
    });

    it("redirects to login if no refresh token exists", async () => {
        mockCookies.get.mockReturnValue(null);

        // Call the async component function directly
        const Component = await EventsPage({ searchParams: Promise.resolve({}) });

        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("fetches events and renders EventsList when authenticated", async () => {
        mockCookies.get.mockReturnValue({ value: "fake-refresh-token" });
        (serverFetch as jest.Mock).mockResolvedValue({
            success: true,
            data: [{ id: "1", title: "Event 1" }, { id: "2", title: "Event 2" }],
            meta: { page: 1, totalPages: 1 },
        });

        const searchParams = Promise.resolve({ search: "party", page: "2" });
        const Component = await EventsPage({ searchParams });
        render(Component);

        expect(serverFetch).toHaveBeenCalledWith("/events", expect.objectContaining({
            page: 2,
            search: "party",
        }));

        expect(screen.getByTestId("events-list")).toHaveTextContent("Count: 2, Search: party");
    });

    it("shows error message if fetch fails", async () => {
        mockCookies.get.mockReturnValue({ value: "fake-refresh-token" });
        (serverFetch as jest.Mock).mockResolvedValue({ success: false });

        const Component = await EventsPage({ searchParams: Promise.resolve({}) });
        render(Component);

        expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument();
    });

    it("redirects to login if fetch fails with 401", async () => {
        mockCookies.get.mockReturnValue({ value: "fake-refresh-token" });
        (serverFetch as jest.Mock).mockResolvedValue({
            success: false,
            error: { statusCode: 401 },
        });

        await EventsPage({ searchParams: Promise.resolve({}) });
        expect(redirect).toHaveBeenCalledWith("/login");
    });
});
