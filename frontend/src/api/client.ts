import axios from 'axios'
import * as Sentry from '@sentry/react'
import { authClient } from '../lib/auth/authClient'

const apiOrigin = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: `${apiOrigin}/api/v1`,
})

apiClient.interceptors.request.use(async (config) => {
  const { session } = await authClient.getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  // Correlation id echoed back by the backend as X-Trace-Id and used as its log
  // traceId, so a frontend error can be traced to the exact server-side request.
  config.headers['X-Request-Id'] = crypto.randomUUID().replace(/-/g, '')
  return config
})

// SPA navigation from outside React. Imported lazily to avoid a static import
// cycle (router → pages → hooks → this module).
async function redirectTo(to: string, opts?: { unless?: string }) {
  if (opts?.unless && window.location.pathname === opts.unless) return
  const { router } = await import('../router')
  void router.navigate(to)
}

// Global response handling. Every API call flows through here, so auth expiry
// and server errors are handled in one place instead of per-query.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    if (status === 401) {
      // Token missing/expired/invalid — clear the stale session and go to login.
      await authClient.signOut()
      await redirectTo('/login', { unless: '/login' })
    } else if ((status >= 500 || status === undefined) && !axios.isCancel(error)) {
      // Server-side failure or network error (no response). Skip canceled
      // requests (e.g. React Query aborting on unmount) so they don't spam
      // Sentry. Tag the request id so it links to the backend logs/trace.
      Sentry.captureException(error, {
        tags: { request_id: error.config?.headers?.['X-Request-Id'] },
        extra: { url: error.config?.url, method: error.config?.method, status },
      })
      if (status >= 500) {
        // Server-side failure — show the global error page.
        await redirectTo('/error')
      }
    }
    return Promise.reject(error)
  },
)
