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
