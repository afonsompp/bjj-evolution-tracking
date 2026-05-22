import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useTranslation } from '../lib/i18n/I18nContext'
import type { AcademyResponse, AcademyMemberResponse, Page } from '../types/api'
import {
  SearchIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '../assets/icons'

export default function AcademyListPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const SIZE = 20

  // ── My academies (ACTIVE memberships) ─────────────────────
  const { data: myMemberships } = useQuery({
    queryKey: ['academy-memberships', 'ACTIVE'],
    queryFn: () =>
      apiClient
        .get<Page<AcademyMemberResponse>>('/academies/memberships', {
          params: { status: 'ACTIVE', page: 0, size: 50 },
        })
        .then((r) => r.data),
  })

  // ── Public academy search ──────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['academies', search, page],
    queryFn: () =>
      apiClient
        .get<Page<AcademyResponse>>('/academies/search', {
          params: { query: search || undefined, page, size: SIZE },
        })
        .then((r) => r.data),
  })

  const totalPages = data?.totalPages ?? 0
  const academies = data?.content ?? []
  const myAcademies = myMemberships?.content ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      {/* ── My Academies section ─────────────────────────────── */}
      {myAcademies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={18} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {translate('academy.myAcademies')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {myAcademies.map((m) => (
              <div
                key={m.academyId}
                className="flex items-start gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <BuildingIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.academyName}</p>
                  {m.academyAddress && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{m.academyAddress}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    onClick={() => navigate(`/academies/${m.academyId}`)}
                    className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {translate('academy.viewSchedule')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Find Academies section ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border-header)] pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {translate('academy.findAcademies')}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {data
                ? translate('academy.count', { count: data.totalElements })
                : translate('academy.loading')}
            </p>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder={translate('academy.searchPlaceholder')}
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
            <p className="text-rose-400">{translate('academy.errorLoad')}</p>
          </div>
        )}

        {!isLoading && academies.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-16 text-center">
            <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
              {search ? translate('academy.emptySearch') : translate('academy.emptyTitle')}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {search ? translate('academy.emptySearchHint') : translate('academy.emptyHint')}
            </p>
          </div>
        )}

        {!isLoading && academies.length > 0 && (
          <div className="space-y-3">
            {academies.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/academies/${a.id}`)}
                className="flex w-full items-start gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-4 text-left shadow-sm transition-colors hover:border-[var(--border-card-hover)]"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <BuildingIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{a.name}</p>
                  {a.address && (
                    <p className="mt-0.5 truncate text-xs text-[var(--text-subtle)]">{a.address}</p>
                  )}
                </div>
                <ChevronRightIcon size={16} className="mt-2.5 shrink-0 text-[var(--text-subtle)]" />
              </button>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon size={14} />
              {translate('academy.previous')}
            </button>
            <span className="text-sm text-[var(--text-subtle)]">
              {translate('academy.pageOf', { page: page + 1, total: totalPages })}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {translate('academy.next')}
              <ChevronRightIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
