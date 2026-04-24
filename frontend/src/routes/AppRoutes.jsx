import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import HomePage from "../pages/HomePage";
import ListingsPage from "../pages/ListingsPage";
import ListingDetailsPage from "../pages/ListingDetailsPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import PlaceholderPage from "../pages/PlaceholderPage";
import ForbiddenPage from "../pages/ForbiddenPage";
import NotFoundPage from "../pages/NotFoundPage";
import MyListingsPage from "../pages/MyListingsPage";
import ListingFormPage from "../pages/ListingFormPage";
import FavoritesPage from "../pages/FavoritesPage";
import ApplicationsPage from "../pages/ApplicationsPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminListingsPage from "../pages/AdminListingsPage";
import AdminVerificationsPage from "../pages/AdminVerificationsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["host", "admin"]} />}>
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/listings/new" element={<ListingFormPage />} />
        <Route path="/listings/:id/edit" element={<ListingFormPage />} />
        <Route
          path="/listings/:id/applicants"
          element={<PlaceholderPage title="Listing Applicants" />}
        />
      </Route>

      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/listings" element={<AdminListingsPage />} />
        <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
