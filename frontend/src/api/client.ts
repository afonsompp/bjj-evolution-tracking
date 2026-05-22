import axios from 'axios'
import { authClient } from '../lib/auth/authClient'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
})

apiClient.interceptors.request.use(async (config) => {
  const { session } = await authClient.getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})
