import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { ThemeProvider } from './lib/ThemeContext'
import { I18nProvider } from './lib/i18n/I18nContext'
import { router } from './router'
import { AppCrashFallback } from './components/AppCrashFallback'

const queryClient = new QueryClient()

export default function App() {
  return (
    // Catches render-time crashes anywhere in the tree, reports them to Sentry,
    // and shows a recoverable fallback instead of a blank white screen.
    <Sentry.ErrorBoundary fallback={({ resetError }) => <AppCrashFallback onReset={resetError} />}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <I18nProvider>
              <RouterProvider router={router} />
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  )
}
