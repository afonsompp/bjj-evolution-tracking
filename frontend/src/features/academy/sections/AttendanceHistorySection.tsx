import { useState } from 'react'
import { useMemberAttendances, useMyAllAttendances } from '../hooks/useAttendanceHistory'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { CalendarIcon, LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../assets/icons'
import type { CheckInStatus } from '../../../types/api'

const PAGE_SIZE = 20

const STATUS_BADGE: Record<CheckInStatus, string> = {
  CONFIRMED: 'bg-emerald-500/10 text-emerald-400',
  REGISTERED: 'bg-amber-500/10 text-amber-400',
  CANCELED: 'bg-zinc-500/10 text-zinc-400',
}

function fullName(p: { name: string; secondName?: string }): string {
  return [p.name, p.secondName].filter(Boolean).join(' ')
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

  const academyId = 'academyId' in props ? props.academyId : undefined
  const userId = props.userId

  const memberResult = useMemberAttendances(
    variant === 'member' ? academyId : undefined,
    variant === 'member' ? userId : undefined,
    page, PAGE_SIZE,
  )
  const mineAllResult = useMyAllAttendances(
    variant === 'mine-all' ? userId : undefined, page, PAGE_SIZE,
  )

  const { data, isLoading, isError } = variant === 'member' ? memberResult : mineAllResult

  const items = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const showAcademy = variant === 'mine-all'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoaderIcon size={20} className="text-[var(--text-muted)]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
        {translate('attendance.history.error')}
      </div>
    )
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

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          {translate('attendance.history.empty')}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((a) => {
              const cls = a.scheduledClass
              return (
                <li
                  key={a.id}
                  className="space-y-1.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {translate(`form.classType.${cls.classType}`)}
                        {showAcademy && (
                          <span className="ml-1.5 text-xs text-[var(--text-subtle)]">{cls.academyName}</span>
                        )}
                      </p>
                      {cls.instructor && (
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {fullName(cls.instructor)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">
                      {new Date(cls.startTime).toLocaleString()}
                    </span>
                  </div>

                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[a.status] ?? ''}`}
                  >
                    {translate(`attendance.status.${a.status}`)}
                  </span>
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
