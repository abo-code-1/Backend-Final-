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
      <Route path="/safety" element={<SafetyPage />} />
      <Route path="/bill-split" element={<BillSplitPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route
        path="/pricing"
        element={
          <PlaceholderPage
            title="Цены и тарифы"
            description="Раздел с тарифами и вариантами продвижения объявлений."
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <PlaceholderPage
            title="Конфиденциальность"
            description="Здесь будут правила обработки персональных данных."
          />
        }
      />
      <Route
        path="/terms"
        element={
          <PlaceholderPage
            title="Условия использования"
            description="Здесь будут опубликованы правила использования платформы."
          />
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Настройки"
              description="Управление аккаунтом, уведомлениями и параметрами безопасности."
            />
          }
        />
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
