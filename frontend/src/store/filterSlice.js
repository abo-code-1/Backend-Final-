import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";

const initialFilter = {
  city: "",
  district: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest"
};

export const fetchSavedSearchesThunk = createAsyncThunk(
  "filters/fetchSavedSearches",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/saved-searches");
      return data.items || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Не удалось загрузить сохраненные поиски"
      );
    }
  }
);

export const saveCurrentSearchThunk = createAsyncThunk(
  "filters/saveCurrentSearch",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/saved-searches", payload);
      return data.item;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Не удалось сохранить поиск"
      );
    }
  }
);

const filterSlice = createSlice({
  name: "filters",
  initialState: {
    activeFilters: initialFilter,
    savedSearches: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    },
    status: "idle",
    error: null
  },
  reducers: {
    replaceFilters(state, action) {
      state.activeFilters = {
        ...initialFilter,
        ...(action.payload || {})
      };
    },
    setFilter(state, action) {
      state.activeFilters = {
        ...state.activeFilters,
        ...action.payload
      };
    },
    resetFilters(state) {
      state.activeFilters = initialFilter;
      state.pagination.page = 1;
    },
    setPagination(state, action) {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    },
    loadSavedSearch(state, action) {
      state.activeFilters = {
        ...state.activeFilters,
        ...(action.payload?.filterJson || {})
      };
      state.pagination.page = 1;
    },
    saveCurrentSearch(state, action) {
      state.savedSearches.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedSearchesThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSavedSearchesThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.savedSearches = action.payload;
      })
      .addCase(fetchSavedSearchesThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(saveCurrentSearchThunk.fulfilled, (state, action) => {
        state.savedSearches.unshift(action.payload);
        toast.success("Поиск сохранен");
      })
      .addCase(saveCurrentSearchThunk.rejected, (_state, action) => {
        toast.error(action.payload);
      });
  }
});

export const {
  replaceFilters,
  setFilter,
  resetFilters,
  setPagination,
  loadSavedSearch,
  saveCurrentSearch
} = filterSlice.actions;
export default filterSlice.reducer;
