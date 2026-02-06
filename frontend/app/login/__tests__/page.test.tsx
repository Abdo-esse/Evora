import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../page";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useRouter } from "next/navigation";
import { loginThunk } from "@/state/auth/authSlice";
import { Role } from "@/lib/types";

// Mock the hooks and thunk
jest.mock("@/state/hooks");
jest.mock("next/navigation");
jest.mock("@/state/auth/authSlice");
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
    },
}));

describe("LoginPage", () => {
    const mockDispatch = jest.fn();
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useAppSelector as jest.Mock).mockReturnValue({ loading: false, error: null });
    });

    it("renders the login form", () => {
        render(<LoginPage />);
        expect(screen.getByText(/Sign in to Evora/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
    });

    it("handles input changes", () => {
        render(<LoginPage />);
        const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        expect(emailInput.value).toBe("test@example.com");
        expect(passwordInput.value).toBe("password123");
    });

    it("dispatches loginThunk on form submission", async () => {
        mockDispatch.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({ role: Role.PARTICIPANT }),
        });

        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
        fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

        expect(mockDispatch).toHaveBeenCalled();
        expect(loginThunk).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/events");
        });
    });

    it("redirects to admin events if user is admin", async () => {
        mockDispatch.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({ role: Role.ADMIN_ORG }),
        });

        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "admin@example.com" } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "admin123" } });
        fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/admin/events");
        });
    });

    it("displays errors from state", () => {
        (useAppSelector as jest.Mock).mockReturnValue({
            loading: false,
            error: "Invalid credentials",
        });

        render(<LoginPage />);
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
});
