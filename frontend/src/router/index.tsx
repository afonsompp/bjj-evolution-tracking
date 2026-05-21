import { createBrowserRouter, Navigate } from 'react-router-dom'
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
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
    ],
  },
])