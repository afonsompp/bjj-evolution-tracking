import { useState } from 'react'
import { useMemberAttendances, useMyAllAttendances } from '../hooks/useAttendanceHistory'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { MAX_DATE, hasYearOverflow, isValidDateRange, isOutOfOrderRange } from '../../../lib/dateValidation'
import { BuildingIcon, CalendarIcon, LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../assets/icons'
import type { CheckInStatus } from '../../../types/api'

const STATUS_ACCENT: Record<CheckInStatus, { dot: string; text: string; icon: string }> = {
  CONFIRMED: { dot: 'bg-emerald-400', text: 'text-emerald-400', icon: 'bg-emerald-500/10 text-emerald-400' },
  REGISTERED: { dot: 'bg-amber-400', text: 'text-amber-400', icon: 'bg-amber-500/10 text-amber-400' },
  CANCELED: { dot: 'bg-zinc-400', text: 'text-zinc-500', icon: 'bg-zinc-500/10 text-zinc-400' },
}

function fullName(p: { name: string; secondName?: string }): string {
  return [p.name, p.secondName].filter(Boolean).join(' ')
}

type Preset = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '1y', label: '1y' },
  { key: 'custom', label: 'Custom' },
]

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Attendance spans both past (attended) and upcoming (registered) classes, so
// each preset window reaches the same number of days in both directions.
function presetRange(preset: Preset): { startDate: string; endDate: string } {
  if (preset === 'all' || preset === 'custom') return { startDate: '', endDate: '' }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  return { startDate: isoDateOffset(-days), endDate: isoDateOffset(days) }
}

/**
 * - `member`    → a member's attendance within one academy (instructors/owners,
 *                 or the signed-in user viewing their own academy history).
 * - `mine-all`  → the signed-in user's attendance across all academies.
 */
type Props =
  | { variant: 'member'; academyId: string; userId?: string }
  | { variant: 'mine-all'; userId?: string }

export function AttendanceHistorySection(props: Props) {
  const { variant } = props
  const { translate } = useTranslation()

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(25)
  const [preset, setPreset] = useState<Preset>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd] = useState('')

  const academyId = 'academyId' in props ? props.academyId : undefined
  const userId = props.userId

  // Custom ranges only run after "Apply": the draft is promoted to the applied
  // range that drives the query. canApply requires both dates valid + changed.
  const canApply =
    isValidDateRange(customStart, customEnd) &&
    (customStart !== appliedStart || customEnd !== appliedEnd)
  const hasError = preset === 'custom' && isOutOfOrderRange(customStart, customEnd)
  const customPending = preset === 'custom' && !appliedStart && !appliedEnd

  const { startDate, endDate } = preset === 'custom'
    ? { startDate: appliedStart, endDate: appliedEnd }
    : presetRange(preset)

  const opts = {
    page,
    size,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    enabled: !customPending,
  }

  const memberResult = useMemberAttendances(
    variant === 'member' ? academyId : undefined,
    variant === 'member' ? userId : undefined,
    opts,
  )
  const mineAllResult = useMyAllAttendances(variant === 'mine-all' ? userId : undefined, opts)

  const { data, isLoading, isError } = variant === 'member' ? memberResult : mineAllResult

  const items = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const showAcademy = variant === 'mine-all'

  const handlePreset = (p: Preset) => { setPreset(p); setPage(0) }
  const handleCustomStart = (v: string) => { if (!hasYearOverflow(v)) setCustomStart(v) }
  const handleCustomEnd = (v: string) => { if (!hasYearOverflow(v)) setCustomEnd(v) }
  const applyCustom = () => {
    if (!canApply) return
    setAppliedStart(customStart)
    setAppliedEnd(customEnd)
    setPage(0)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarIcon size={16} className="text-[var(--text-muted)]" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {translate('attendance.history.title')}
        </h2>
        {data && (
          <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            {data.totalElements}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  preset === key
                    ? 'bg-[var(--text-primary)] text-[var(--bg-page)]'
                    : 'border border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {key === 'all' ? translate('filter.all') : key === 'custom' ? translate('filter.custom') : label}
              </button>
            ))}
          </div>
          <select
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
            className="shrink-0 rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-1.5 text-xs text-[var(--text-muted)] outline-none"
          >
            {[10, 25, 50].map((s) => (
              <option key={s} value={s}>{translate('filter.perPage', { count: s })}</option>
            ))}
          </select>
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={customStart}
              max={customEnd || MAX_DATE}
              onChange={(e) => handleCustomStart(e.target.value)}
              className={`rounded-md border bg-[var(--bg-select)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] ${
                hasError ? 'border-rose-500' : 'border-[var(--border-select)]'
              }`}
            />
            <span className="text-xs text-[var(--text-subtle)]">—</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              max={MAX_DATE}
              onChange={(e) => handleCustomEnd(e.target.value)}
              className={`rounded-md border bg-[var(--bg-select)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] ${
                hasError ? 'border-rose-500' : 'border-[var(--border-select)]'
              }`}
            />
            <button
              onClick={applyCustom}
              disabled={!canApply}
              className="rounded-md bg-[var(--text-primary)] px-3 py-1 text-xs font-medium text-[var(--bg-page)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {translate('filter.apply')}
            </button>
            {hasError && <span className="text-xs text-rose-500">{translate('filter.invalidRange')}</span>}
          </div>
        )}
      </div>

      {customPending ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          {translate('filter.customPrompt')}
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon size={20} className="text-[var(--text-muted)]" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {translate('attendance.history.error')}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          {translate('attendance.history.empty')}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((a) => {
              const cls = a.scheduledClass
              const accent = STATUS_ACCENT[a.status] ?? STATUS_ACCENT.CANCELED
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 transition-colors hover:border-[var(--border-card-hover)]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}>
                    <CalendarIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {translate(`form.classType.${cls.classType}`)}
                      </p>
                      <time className="shrink-0 text-xs text-[var(--text-muted)]">
                        {new Date(cls.startTime).toLocaleString()}
                      </time>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${accent.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                        {translate(`attendance.status.${a.status}`)}
                      </span>
                      {cls.instructor && (
                        <>
                          <span className="text-[var(--text-subtle)]">·</span>
                          <span className="truncate">{fullName(cls.instructor)}</span>
                        </>
                      )}
                    </div>
                    {showAcademy && cls.academyName && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--text-subtle)]">
                        <BuildingIcon size={11} className="shrink-0" />
                        {cls.academyName}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <ChevronLeftIcon size={12} /> {translate('academy.previous')}
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                {translate('academy.next')} <ChevronRightIcon size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
