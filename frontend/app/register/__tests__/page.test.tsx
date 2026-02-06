import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../page";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useRouter } from "next/navigation";
import { registerThunk } from "@/state/auth/authSlice";

// Mock hooks and thunk
jest.mock("@/state/hooks");
jest.mock("next/navigation");
jest.mock("@/state/auth/authSlice");
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
    },
}));

describe("RegisterPage", () => {
    const mockDispatch = jest.fn();
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useAppSelector as jest.Mock).mockReturnValue({ loading: false, error: null });
    });

    it("renders the register form", () => {
        render(<RegisterPage />);
        expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Create account/i })).toBeInTheDocument();
    });

    it("handles input changes", () => {
        render(<RegisterPage />);

        const firstNameInput = screen.getByLabelText(/First name/i) as HTMLInputElement;
        const lastNameInput = screen.getByLabelText(/Last name/i) as HTMLInputElement;
        const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

        fireEvent.change(firstNameInput, { target: { value: "John" } });
        fireEvent.change(lastNameInput, { target: { value: "Doe" } });
        fireEvent.change(emailInput, { target: { value: "john@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        expect(firstNameInput.value).toBe("John");
        expect(lastNameInput.value).toBe("Doe");
        expect(emailInput.value).toBe("john@example.com");
        expect(passwordInput.value).toBe("password123");
    });

    it("dispatches registerThunk on form submission and redirects to login", async () => {
        mockDispatch.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({}),
        });

        render(<RegisterPage />);
        fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
        fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "john@example.com" } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

        expect(mockDispatch).toHaveBeenCalled();
        expect(registerThunk).toHaveBeenCalledWith({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "password123",
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/login");
        });
    });

    it("displays errors from state", () => {
        (useAppSelector as jest.Mock).mockReturnValue({
            loading: false,
            error: "Email already exists",
        });

        render(<RegisterPage />);
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
});
