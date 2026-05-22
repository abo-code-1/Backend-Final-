import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const ACCESS_KEY = "roomie_token";
const REFRESH_KEY = "roomie_refresh";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

const initialAccess = tokenStorage.getAccess();
if (initialAccess) setAuthToken(initialAccess);

apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let onSessionExpired = null;
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

let refreshInFlight = null;

const callRefresh = async () => {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
  // Use a bare axios call so this request never re-enters the interceptor.
  const { data } = await axios.post(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
  tokenStorage.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  });
  setAuthToken(data.accessToken);
  return data.accessToken;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint =
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/register") ||
      original?.url?.includes("/auth/refresh") ||
      original?.url?.includes("/auth/logout");

    if (status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }
    if (!tokenStorage.getRefresh()) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshInFlight = refreshInFlight || callRefresh();
      const newAccess = await refreshInFlight;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (refreshErr) {
      tokenStorage.clear();
      setAuthToken(null);
      if (typeof onSessionExpired === "function") onSessionExpired();
      return Promise.reject(refreshErr);
    } finally {
      refreshInFlight = null;
    }
  }
);
