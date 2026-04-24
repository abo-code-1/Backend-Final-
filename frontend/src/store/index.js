import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import filterReducer from "./filterSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filterReducer
  }
});
