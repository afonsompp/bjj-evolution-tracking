/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // Source maps are uploaded to Sentry (and then stripped from the deploy) only
  // when a SENTRY_AUTH_TOKEN is present at build time. Without it the plugin is
  // skipped, so local/PR builds are unaffected.
  const sentryEnabled = Boolean(env.SENTRY_AUTH_TOKEN)
  // Dev-only: where `npm run dev` forwards /api. Override via VITE_DEV_PROXY_TARGET
  // (e.g. your LAN IP to test from a phone). Not used by the production build.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'assets/favicon.svg',
          'assets/favicon.ico',
          'assets/apple-touch-icon-180x180.png',
        ],
        manifest: {
          name: 'BJJ Evolution',
          short_name: 'BJJ Evolution',
          description: 'Track your jiu-jitsu journey',
          theme_color: '#863bff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'assets/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'assets/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'assets/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'assets/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
          cleanupOutdatedCaches: true,
        },
      }),
      // Must come last so it sees the final bundle. Uploads source maps so Sentry
      // stack traces are de-minified, then deletes them from the output.
      ...(sentryEnabled
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
              release: env.VITE_SENTRY_RELEASE
                ? { name: env.VITE_SENTRY_RELEASE }
                : undefined,
              sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            }),
          ]
        : []),
    ],
    // Generate source maps so the Sentry plugin can upload them (and strip them
    // from the deploy afterwards).
    build: {
      sourcemap: sentryEnabled,
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Dummy Supabase env so importing src/lib/supabase.ts (createClient runs at
      // import time) doesn't throw during tests. No network calls are made.
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
  }
})
