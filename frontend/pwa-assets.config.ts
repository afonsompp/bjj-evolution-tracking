import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Source is pwa-icon.svg (slate background) so installed PWA / home-screen
// icons aren't rendered on black. The browser-tab favicon (favicon.svg) is a
// separate transparent file referenced directly from index.html.
export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: { background: '#18181b' } },
    apple: { ...preset.apple, resizeOptions: { background: '#18181b' } },
  },
  images: ['public/assets/pwa-icon.svg'],
})
