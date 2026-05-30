import { createBrowserRouter, Navigate } from 'react-router-dom'
import NotFoundPage from '../pages/NotFoundPage'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import OnboardingPage from '../pages/OnboardingPage'
import DashboardPage from '../pages/DashboardPage'
import ProfilePage from '../pages/ProfilePage'
import HistoryPage from '../pages/HistoryPage'
import TrainingFormPage from '../pages/TrainingFormPage'
import TechniqueManagePage from '../pages/TechniqueManagePage'
import AcademyListPage from '../pages/AcademyListPage'
import AcademyDetailPage from '../pages/AcademyDetailPage'
import AcademyCreatePage from '../pages/AcademyCreatePage'
import AcademySettingsPage from '../pages/AcademySettingsPage'
import AcademyMembersPage from '../pages/AcademyMembersPage'
import ClassManagementPage from '../pages/ClassManagementPage'
import ClassFormPage from '../pages/ClassFormPage'
import TemplateFormPage from '../pages/TemplateFormPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import { RequireAcademyCap } from '../features/academy/permissions/RequireAcademyCap'
import { RequireAdmin } from '../features/admin/RequireAdmin'
import ErrorPage from '../pages/ErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Standalone (outside AppLayout) so it renders even when the app shell or a
  // server error would otherwise break. The 401/5xx interceptor redirects here.
  { path: '/error', element: <ErrorPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/training', element: <HistoryPage /> },
      { path: '/training/new', element: <TrainingFormPage /> },
      { path: '/training/:id/edit', element: <TrainingFormPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/techniques', element: <TechniqueManagePage /> },
      {
        path: '/admin/users',
        element: (
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        ),
      },
      { path: '/academies', element: <AcademyListPage /> },
      { path: '/academies/new', element: <AcademyCreatePage /> },
      { path: '/academies/:id', element: <AcademyDetailPage /> },
      {
        path: '/academies/:id/settings',
        element: (
          <RequireAcademyCap cap="canEditAcademy">
            <AcademySettingsPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/members',
        element: (
          <RequireAcademyCap cap="canManageMembers">
            <AcademyMembersPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/classes',
        element: (
          <RequireAcademyCap cap="canManageClasses">
            <ClassManagementPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/classes/new',
        element: (
          <RequireAcademyCap cap="canManageClasses">
            <ClassFormPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/classes/:classId/edit',
        element: (
          <RequireAcademyCap cap="canManageClasses">
            <ClassFormPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/templates/new',
        element: (
          <RequireAcademyCap cap="canManageClasses">
            <TemplateFormPage />
          </RequireAcademyCap>
        ),
      },
      {
        path: '/academies/:id/templates/:templateId/edit',
        element: (
          <RequireAcademyCap cap="canManageClasses">
            <TemplateFormPage />
          </RequireAcademyCap>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])