import { useState } from 'react'
import {
  useAcademyGraduations,
  useMyGraduations,
  useMyAllGraduations,
} from '../hooks/useGraduationHistory'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { beltKey } from '../../../lib/i18n/belts'
import { TrophyIcon, LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../assets/icons'
import type { Belt } from '../../../types/api'

const PAGE_SIZE = 20

function beltBadgeClass(belt: Belt | undefined): string {
  switch (belt) {
    case 'BLUE': return 'bg-blue-500/20 text-blue-400'
    case 'PURPLE': return 'bg-purple-500/20 text-purple-400'
    case 'BROWN': return 'bg-amber-700/20 text-amber-600'
    case 'BLACK': return 'bg-zinc-600/30 text-zinc-300'
    case 'YELLOW': case 'YELLOW_WHITE': case 'YELLOW_BLACK':
      return 'bg-yellow-400/20 text-yellow-500'
    case 'ORANGE': case 'ORANGE_WHITE': case 'ORANGE_BLACK':
      return 'bg-orange-500/20 text-orange-400'
    case 'GREEN': case 'GREEN_WHITE': case 'GREEN_BLACK':
      return 'bg-green-500/20 text-green-400'
    default: return 'bg-zinc-200/20 text-zinc-400'
  }
}

type Translate = (key: string, params?: Record<string, string | number>) => string

function beltDisplay(
  translate: Translate,
  belt: Belt | undefined,
  stripe: number | undefined,
): string {
  const label = belt ? translate(beltKey(belt)) : '—'
  return stripe && stripe > 0 ? `${label} · ${stripe}` : label
}

function fullName(p: { name: string; secondName?: string }): string {
  return [p.name, p.secondName].filter(Boolean).join(' ')
}

/**
 * - `academy`   → every graduation in one academy (instructors/owners).
 * - `mine`      → the signed-in user's graduations within one academy.
 * - `mine-all`  → the signed-in user's graduations across all academies.
 */
type Props =
  | { variant: 'academy'; academyId: string }
  | { variant: 'mine'; academyId: string; userId?: string }
  | { variant: 'mine-all'; userId?: string }

export function GraduationHistorySection(props: Props) {
  const { variant } = props
  const { translate } = useTranslation()
  const [page, setPage] = useState(0)

  const academyId = 'academyId' in props ? props.academyId : undefined
  const userId = 'userId' in props ? props.userId : undefined

  const academyResult = useAcademyGraduations(
    variant === 'academy' ? academyId : undefined, page, PAGE_SIZE,
  )
  const mineResult = useMyGraduations(
    variant === 'mine' ? academyId : undefined,
    variant === 'mine' ? userId : undefined,
    page, PAGE_SIZE,
  )
  const mineAllResult = useMyAllGraduations(
    variant === 'mine-all' ? userId : undefined, page, PAGE_SIZE,
  )

  const { data, isLoading, isError } =
    variant === 'academy' ? academyResult : variant === 'mine' ? mineResult : mineAllResult

  const items = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const showStudent = variant === 'academy'
  const showAcademy = variant === 'mine-all'

  const title = variant === 'academy'
    ? translate('graduation.titleAcademy')
    : translate('graduation.titleMine')

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
        {translate('graduation.error')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrophyIcon size={16} className="text-amber-400" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        {data && (
          <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            {data.totalElements}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          {translate('graduation.empty')}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((g) => (
              <li
                key={g.id}
                className="space-y-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {showStudent ? (
                        <>
                          {fullName(g.student)}
                          {g.student.nickname && (
                            <span className="ml-1.5 text-xs text-[var(--text-subtle)]">@{g.student.nickname}</span>
                          )}
                        </>
                      ) : showAcademy ? (
                        g.academyName
                      ) : (
                        <>
                          {translate('graduation.promotedBy')}{' '}
                          <span className="text-[var(--text-subtle)]">{fullName(g.promotedBy)}</span>
                        </>
                      )}
                    </p>
                    {variant !== 'mine' && (
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {translate('graduation.promotedBy')}{' '}
                        <span className="text-[var(--text-subtle)]">{fullName(g.promotedBy)}</span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {new Date(g.graduationDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {g.oldBelt ? (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${beltBadgeClass(g.oldBelt)}`}>
                      {beltDisplay(translate, g.oldBelt, g.oldStripe)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">→</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${beltBadgeClass(g.newBelt)}`}>
                    {beltDisplay(translate, g.newBelt, g.newStripe)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <ChevronLeftIcon size={12} /> Prev
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                Next <ChevronRightIcon size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
