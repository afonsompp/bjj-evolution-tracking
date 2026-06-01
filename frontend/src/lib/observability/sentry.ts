import * as Sentry from '@sentry/react'

/**
 * Initialise Sentry for error tracking + performance (web vitals are captured
 * automatically by the browser-tracing integration).
 *
 * No-op when VITE_SENTRY_DSN is unset, so local dev and PR previews don't report
 * unless explicitly configured. Call once, before rendering.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const apiOrigin = import.meta.env.VITE_API_BASE_URL ?? ''

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    // Performance sampling. Keep low in prod to stay within quota; raise while
    // validating. Web vitals (LCP, INP, CLS, ...) ride along on these traces.
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    // Attach sentry-trace/baggage headers to our API calls so a frontend trace
    // links to the matching backend trace. Same-origin paths plus the explicit
    // API origin (the backend's CORS must allow these headers — see SecurityConfig).
    tracePropagationTargets: [/^\//, ...(apiOrigin ? [apiOrigin] : [])],
  })
}
