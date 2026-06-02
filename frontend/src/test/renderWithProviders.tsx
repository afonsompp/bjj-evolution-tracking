import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from '../lib/i18n/I18nContext'
import { ThemeProvider } from '../lib/ThemeContext'
import { createTestQueryClient } from './queryWrapper'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Single initial location (shorthand for `initialEntries: [route]`). */
  route?: string
  /** When set, the UI is mounted as the element of a `<Route path={path}>` so
   *  `useParams` resolves against `route`. Otherwise it renders inline. */
  path?: string
  initialEntries?: string[]
  queryClient?: QueryClient
}

/**
 * Render a component inside the app's real providers — QueryClient (test-tuned),
 * I18n, Theme and a MemoryRouter. Returns the render result plus the `client`.
 */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', path, initialEntries, queryClient, ...rest } = options
  const client = queryClient ?? createTestQueryClient()
  const entries = initialEntries ?? [route]

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nProvider>
          <ThemeProvider>
            <MemoryRouter initialEntries={entries}>
              {path ? (
                <Routes>
                  <Route path={path} element={children} />
                </Routes>
              ) : (
                children
              )}
            </MemoryRouter>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }

  return { client, ...render(ui, { wrapper: Wrapper, ...rest }) }
}
