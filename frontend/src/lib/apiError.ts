import axios from 'axios'

/**
 * Best-effort extraction of the backend error message from an unknown thrown
 * value. Returns undefined when the error isn't an Axios error carrying a
 * `{ message }` body, so callers can fall back to a localized default.
 */
export function apiErrorMessage(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string') return message
    }
  }
  return undefined
}
