// Shown by the top-level Sentry.ErrorBoundary when a render-time crash escapes
// the rest of the app. It lives above the I18n/Theme providers, so it can't use
// the translation hook — copy is intentionally static. CSS vars are global.
export function AppCrashFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-7xl font-bold text-[var(--text-subtle)]">:(</p>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        The app hit an unexpected error. It has been reported. Try again.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={onReset}
          className="rounded-lg bg-[var(--text-primary)] px-5 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="rounded-lg border border-[var(--border-card)] px-5 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Go home
        </button>
      </div>
    </div>
  )
}
