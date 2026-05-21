import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import {
  apiClient,
  setAuthToken,
  setSessionExpiredHandler,
  tokenStorage
} from "../api/client";

const initialAccess = tokenStorage.getAccess();
const initialRefresh = tokenStorage.getRefresh();
if (initialAccess) setAuthToken(initialAccess);

const persistTokens = (payload) => {
  const accessToken = payload.accessToken || payload.token;
  const refreshToken = payload.refreshToken;
  tokenStorage.set({ accessToken, refreshToken });
  setAuthToken(accessToken);
  return { accessToken, refreshToken };
};

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
      // Keep the full error payload (message + code + email) so the UI can
      // react to specific cases if needed.
      return rejectWithValue(error.response?.data || { message: "Login failed" });
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

export const logoutThunk = createAsyncThunk(
  "auth/logoutServer",
  async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      // Best-effort revoke; ignore network errors so logout always proceeds.
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        /* swallow — local cleanup happens regardless */
      }
    }
    return true;
  }
);

export const switchRoleThunk = createAsyncThunk(
  "auth/switchRole",
  async (role, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch("/auth/switch-role", { role });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not switch role"
      );
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch("/auth/me", payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not update profile"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: initialAccess,
    refreshToken: initialRefresh,
    role: null,
    status: "idle",
    error: null
  },
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.status = "idle";
      state.error = "Сессия истекла";
      tokenStorage.clear();
      setAuthToken(null);
      toast.info("Сессия истекла. Войдите снова.");
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    const onAuthFulfilled = (state, action, successMessage) => {
      const { accessToken, refreshToken } = persistTokens(action.payload);
      state.status = "succeeded";
      state.user = action.payload.user;
      state.token = accessToken;
      state.refreshToken = refreshToken || state.refreshToken;
      state.role = action.payload.user?.role || null;
      if (successMessage) toast.success(successMessage);
    };

    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) =>
        onAuthFulfilled(state, action, "Аккаунт создан. Подтвердите email.")
      )
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) =>
        onAuthFulfilled(state, action, "Вход выполнен")
      )
      .addCase(loginThunk.rejected, (state, action) => {
        const message = action.payload?.message || "Login failed";
        state.status = "failed";
        state.error = message;
        toast.error(message);
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
          state.refreshToken = null;
          state.role = null;
          tokenStorage.clear();
          setAuthToken(null);
          toast.info("Сессия истекла. Войдите снова.");
        }
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.role = null;
        state.status = "idle";
        state.error = null;
        tokenStorage.clear();
        setAuthToken(null);
        toast.info("Вы вышли из аккаунта");
      })
      .addCase(switchRoleThunk.fulfilled, (state, action) => {
        const { accessToken } = persistTokens(action.payload);
        state.user = action.payload.user;
        state.token = accessToken;
        state.role = action.payload.user?.role || null;
        toast.success("Роль обновлена");
      })
      .addCase(switchRoleThunk.rejected, (_state, action) => {
        toast.error(action.payload);
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        if (action.payload?.user) {
          state.user = action.payload.user;
          state.role = action.payload.user.role || state.role;
        }
        toast.success("Профиль обновлён");
      })
      .addCase(updateProfileThunk.rejected, (_state, action) => {
        toast.error(action.payload);
      });
  }
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
// Back-compat alias: callers used to dispatch `logout()` to clear local state.
// Now they should dispatch `logoutThunk()` so the refresh token is also revoked
// server-side. We keep the named export pointing at the thunk to avoid breaking
// existing imports.
export const logout = logoutThunk;

// Wire the API client so a refresh failure flips Redux state.
export const installSessionExpiredBridge = (store) => {
  setSessionExpiredHandler(() => store.dispatch(sessionExpired()));
};

export default authSlice.reducer;
