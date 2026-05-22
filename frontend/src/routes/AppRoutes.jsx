import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import HomePage from "../pages/HomePage";
import ListingsPage from "../pages/ListingsPage";
import ListingDetailsPage from "../pages/ListingDetailsPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";
import ForbiddenPage from "../pages/ForbiddenPage";
import NotFoundPage from "../pages/NotFoundPage";
import MyListingsPage from "../pages/MyListingsPage";
import ListingFormPage from "../pages/ListingFormPage";
import ListingApplicantsPage from "../pages/ListingApplicantsPage";
import FavoritesPage from "../pages/FavoritesPage";
import ApplicationsPage from "../pages/ApplicationsPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminListingsPage from "../pages/AdminListingsPage";
import AdminVerificationsPage from "../pages/AdminVerificationsPage";
import AdminCitiesPage from "../pages/AdminCitiesPage";
import AdminNeighborhoodsPage from "../pages/AdminNeighborhoodsPage";
import AboutPage from "../pages/AboutPage";
import BlogPage from "../pages/BlogPage";
import ContactPage from "../pages/ContactPage";
import HelpPage from "../pages/HelpPage";
import HowItWorksPage from "../pages/HowItWorksPage";
import MessagesPage from "../pages/MessagesPage";
import NeighborhoodsPage from "../pages/NeighborhoodsPage";
import SafetyPage from "../pages/SafetyPage";
import BillSplitPage from "../pages/BillSplitPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import PricingPage from "../pages/PricingPage";
import PrivacyPage from "../pages/PrivacyPage";
import TermsPage from "../pages/TermsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<HelpPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/safety" element={<SafetyPage />} />
      <Route path="/bill-split" element={<BillSplitPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["host", "admin", "super_admin"]} />}>
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/listings/new" element={<ListingFormPage />} />
        <Route path="/listings/:id/edit" element={<ListingFormPage />} />
        <Route
          path="/listings/:id/applicants"
          element={<ListingApplicantsPage />}
        />
      </Route>

      <Route element={<RoleRoute allowedRoles={["admin", "super_admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/listings" element={<AdminListingsPage />} />
        <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["super_admin"]} />}>
        <Route path="/admin/cities" element={<AdminCitiesPage />} />
        <Route path="/admin/neighborhoods" element={<AdminNeighborhoodsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
