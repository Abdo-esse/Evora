import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { setAccessToken, clearAccessToken } from "@/lib/auth";
import type {
  User,
  LoginPayload,
  RegisterPayload,
  LoginResponse,
} from "@/lib/types";

// ---- State ----
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | string[] | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// ---- Thunks ----
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ success: boolean; data: LoginResponse }>("/auth/login", payload);
      const loginData = data.data;
      setAccessToken(loginData.accessToken);
      return loginData.user;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? "Login failed";
      return rejectWithValue(msg);
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      return data.data;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? "Registration failed";
      return rejectWithValue(msg);
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ success: boolean; data: User }>("/auth/me");
      return data.data;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? "Unauthorized";
      return rejectWithValue(msg);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
    } catch {
      // swallow
    }
    clearAccessToken();
  }
);

export const refreshThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ success: boolean; data: { accessToken: string } }>("/auth/refresh");
      const token = data.data.accessToken;
      setAccessToken(token);
      return token;
    } catch (err: any) {
      clearAccessToken();
      return rejectWithValue("Refresh failed");
    }
  }
);

// ---- Slice ----
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | string[];
    });

    // Register
    builder.addCase(registerThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | string[];
    });

    // Me
    builder.addCase(fetchMeThunk.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchMeThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchMeThunk.rejected, (state) => {
      state.loading = false;
      state.user = null;
    });

    // Logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
