import { Outlet, Link } from 'react-router-dom'
import { useTheme } from '../lib/ThemeContext'
import { SunIcon, MoonIcon } from '../assets/icons'

export default function AuthLayout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 transition-colors">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">BJJ Evolution</h1>
            <button
              onClick={toggle}
              className="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            </button>
          </div>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">Track your jiu-jitsu journey</p>
        </div>
        <Outlet />
        <p className="mt-6 text-center text-xs text-[var(--text-subtle)]">
          &copy; {new Date().getFullYear()} BJJ Evolution
        </p>
      </div>
    </div>
  )
}
