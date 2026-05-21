import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { apiClient, setAuthToken } from "../api/client";

const TOKEN_KEY = "roomie_token";
const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

const initialToken = getStoredToken();
if (initialToken) {
  setAuthToken(initialToken);
}

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/register", payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/login", payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const loadProfileThunk = createAsyncThunk(
  "auth/loadProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/auth/me");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not load profile"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: initialToken,
    role: null,
    status: "idle",
    error: null
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.role = action.payload?.role || null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.role = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      toast.info("Вы вышли из аккаунта");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user?.role || null;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        setAuthToken(action.payload.token);
        toast.success("Регистрация выполнена");
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user?.role || null;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        setAuthToken(action.payload.token);
        toast.success("Вход выполнен");
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(loadProfileThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadProfileThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.role = action.payload.user?.role || null;
      })
      .addCase(loadProfileThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        if (state.token) {
          state.user = null;
          state.token = null;
          state.role = null;
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
          toast.info("Сессия истекла. Войдите снова.");
        }
      });
  }
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
