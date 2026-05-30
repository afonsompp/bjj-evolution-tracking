import { useState } from 'react'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useAdminUserSearch, useUpdateUserRole } from '../features/admin/hooks/useAdminUsers'
import { useProfile } from '../features/profile/useProfile'
import { Avatar } from '../components/Avatar'
import type { UserRole } from '../types/api'
import {
  SearchIcon,
  ShieldIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../assets/icons'

const SIZE = 20
const ROLES: UserRole[] = ['CUSTOMER', 'PLATFORM_MANAGER', 'ADMIN']

export default function AdminUsersPage() {
  const { translate } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data: me } = useProfile()
  const { data, isLoading, isError } = useAdminUserSearch(search, page, SIZE)
  const updateRole = useUpdateUserRole()

  const totalPages = data?.totalPages ?? 0
  const users = data?.content ?? []

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateRole.mutate({ userId, role })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border-header)] pb-4">
        <ShieldIcon size={22} className="text-[var(--text-primary)]" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {translate('admin.title')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {data
              ? translate('admin.count', { count: data.totalElements })
              : translate('admin.loading')}
          </p>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={translate('admin.searchPlaceholder')}
          className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <div className="h-5 w-48 rounded bg-[var(--bg-subtle)]" />
              <div className="mt-2 h-4 w-32 rounded bg-[var(--bg-subtle)]" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-rose-400">{translate('admin.errorLoad')}</p>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-16 text-center">
          <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
            {search ? translate('admin.emptySearch') : translate('admin.emptyTitle')}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {search ? translate('admin.emptySearchHint') : translate('admin.emptyHint')}
          </p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="space-y-3">
          {users.map((u) => {
            const savingThis =
              updateRole.isPending && updateRole.variables?.userId === u.id
            // Admins can't demote themselves (enforced server-side too).
            const isSelf = u.id === me?.id
            return (
              <div
                key={u.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-4 shadow-sm"
              >
                <Avatar photoUrl={u.photoUrl} name={u.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {u.name}
                    {u.secondName ? ` ${u.secondName}` : ''}
                    <span className="ml-1.5 text-[var(--text-subtle)]">@{u.nickname}</span>
                    {isSelf && (
                      <span className="ml-1.5 text-[var(--text-subtle)]">({translate('admin.you')})</span>
                    )}
                  </p>
                  {u.email && (
                    <p className="mt-0.5 truncate text-xs text-[var(--text-subtle)]">{u.email}</p>
                  )}
                </div>
                <select
                  value={u.role}
                  disabled={savingThis || isSelf}
                  title={isSelf ? translate('admin.selfRoleLocked') : undefined}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  className="shrink-0 rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {translate(`admin.role.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      {updateRole.isError && (
        <p className="text-center text-sm text-rose-400">{translate('admin.roleUpdateError')}</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeftIcon size={14} />
            {translate('admin.previous')}
          </button>
          <span className="text-sm text-[var(--text-subtle)]">
            {translate('admin.pageOf', { page: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {translate('admin.next')}
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
