import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../features/auth/AuthContext'
import { useProfile } from '../features/profile/useProfile'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useTheme } from '../lib/ThemeContext'
import type { Locale } from '../lib/i18n/translations'
import {
  SunIcon,
  MoonIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserIcon,
  GlobeIcon,
  LogOutIcon,
} from '../assets/icons'

const languages: { code: Locale; labelKey: string }[] = [
  { code: 'en-US', labelKey: 'language.en-US' },
  { code: 'pt-BR', labelKey: 'language.pt-BR' },
]

export default function AppLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { locale, setLocale, translate } = useTranslation()
  const { theme, toggle } = useTheme()
  const [accountOpen, setAccountOpen] = useState(false)
  const location = useLocation()

  // ── Profile fetch (for role check) ──────────────────────
  const { data: profile, error: profileError } = useProfile()
  const isAdmin = profile?.role === 'ADMIN'

  // ── Redirect to onboarding only when profile does not exist (404) ──
  useEffect(() => {
    const isNotFound =
      axios.isAxiosError(profileError) && profileError.response?.status === 404
    if (isNotFound && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [profileError, location.pathname, navigate])

  // ── Nav items (techniques only for admin) ────────────────
  const navItems: { to: string; labelKey: string; end?: boolean }[] = [
    { to: '/dashboard', labelKey: 'nav.dashboard' },
    { to: '/training', labelKey: 'nav.training', end: true },
    { to: '/academies', labelKey: 'nav.academies' },
    ...(isAdmin ? [{ to: '/techniques', labelKey: 'nav.techniques' } as const] : []),
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 py-3 text-center text-xs ${
      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'
    }`

  const accountBtnClass =
    'flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors'

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 flex-col border-r border-[var(--border-header)] bg-[var(--bg-sidebar)] p-4 md:flex">
        <Link to="/" className="mb-6 inline-block text-lg font-bold text-[var(--text-primary)] hover:opacity-80">
          BJJ Evolution
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, labelKey, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {translate(labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          {/* My Account button */}
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserIcon />
              <span>{translate('nav.myAccount')}</span>
            </div>
            {accountOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>

          {accountOpen && (
            <div className="mt-1 ml-2 space-y-0.5 border-l border-[var(--border-row)] pl-3">
              {/* Profile */}
              <button
                onClick={() => navigate('/profile')}
                className={accountBtnClass}
              >
                <UserIcon />
                <span>{translate('nav.profile')}</span>
              </button>

              {/* Language */}
              <div className={accountBtnClass} onClick={(e) => e.stopPropagation()}>
                <GlobeIcon />
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="flex-1 bg-transparent text-sm text-[var(--text-muted)] outline-none"
                >
                  {languages.map(({ code, labelKey }) => (
                    <option key={code} value={code}>
                      {translate(labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <button
                onClick={(e) => { e.stopPropagation(); toggle() }}
                className={accountBtnClass}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>

              {/* Admin section */}
              {isAdmin && (
                <div className="border-t border-[var(--border-row)] my-1.5" />
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className={accountBtnClass + ' text-rose-500 hover:text-rose-400'}
              >
                <LogOutIcon />
                <span>{translate('nav.signOut')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header + main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border-header)] bg-[var(--bg-page)] p-4 md:hidden">
          <Link to="/" className="text-sm font-bold hover:opacity-80">BJJ Evolution</Link>
          <div className="relative">
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              title={translate('nav.myAccount')}
              aria-label={translate('nav.myAccount')}
            >
              <UserIcon />
            </button>
            {accountOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAccountOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--border-header)] bg-[var(--bg-page)] p-1 shadow-lg">
                  <button
                    onClick={() => { setAccountOpen(false); navigate('/profile') }}
                    className={accountBtnClass}
                  >
                    <UserIcon />
                    <span>{translate('nav.profile')}</span>
                  </button>
                  <div className={accountBtnClass} onClick={(e) => e.stopPropagation()}>
                    <GlobeIcon />
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as Locale)}
                      className="flex-1 bg-transparent text-sm text-[var(--text-muted)] outline-none"
                    >
                      {languages.map(({ code, labelKey }) => (
                        <option key={code} value={code}>
                          {translate(labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => { toggle() }}
                    className={accountBtnClass}
                  >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                  </button>
                  <button
                    onClick={() => { setAccountOpen(false); handleSignOut() }}
                    className={accountBtnClass + ' text-rose-500 hover:text-rose-400'}
                  >
                    <LogOutIcon />
                    <span>{translate('nav.signOut')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[var(--border-header)] bg-[var(--bg-page)] md:hidden">
        {navItems.map(({ to, labelKey, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
            {translate(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
