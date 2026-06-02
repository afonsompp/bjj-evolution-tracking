import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, type RenderHookOptions } from '@testing-library/react'
import type { ReactNode } from 'react'

// A QueryClient tuned for tests: no retries (so a rejected queryFn surfaces the
// error immediately instead of after backoff) and no cache retention between
// tests.
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

// renderHook with a QueryClientProvider already wired. Returns the usual
// renderHook result plus the `client` so tests can spy on invalidation.
export function renderHookWithClient<Result, Props>(
  hook: (props: Props) => Result,
  options?: { client?: QueryClient } & Omit<RenderHookOptions<Props>, 'wrapper'>,
) {
  const client = options?.client ?? createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, ...renderHook(hook, { wrapper, ...options }) }
}
