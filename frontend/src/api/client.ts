import axios from 'axios'
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
    } else if (status >= 500) {
      // Server-side failure — show the global error page.
      await redirectTo('/error')
    }
    return Promise.reject(error)
  },
)
