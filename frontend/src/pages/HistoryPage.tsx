import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { MAX_DATE, hasYearOverflow, isApplicableRange, isOutOfOrderRange } from '../lib/dateValidation'
import { useTrainings } from '../features/training/hooks/useTrainings'
import { useDeleteTraining } from '../features/training/hooks/useManageTraining'
import type { TrainingResponse } from '../types/api'
import {
  ActivityIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  PencilIcon,
  HeartIcon,
  ZapIcon,
  CrosshairIcon,
  TrophyIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from '../assets/icons'

// ── Helpers ──────────────────────────────────────────────
function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Compact numeric date (e.g. "01/06/2026") used on narrow/mobile screens.
function formatDateShort(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatTime(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Delete Confirmation Modal ────────────────────────────
function ConfirmModal({
  open, title, message, onConfirm, onCancel, confirmLabel, cancelLabel,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  cancelLabel: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-rose-500/10 p-2 text-rose-500"><AlertTriangleIcon /></div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-[var(--text-muted)]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Technique Badge ──────────────────────────────────────
function TechniqueBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-subtle)] px-3 py-1 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text-primary)]">{name}</span>
    </span>
  )
}

// ── Training Card ────────────────────────────────────────
function TrainingCard({
  training, onDelete, isDeleting, locale,
}: {
  training: TrainingResponse
  onDelete: () => void
  isDeleting: boolean
  locale: string
}) {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const typeLabel =
    training.trainingType === 'GI' ? translate('history.gi') : translate('history.noGi')
  const classLabel = translate(`history.classType.${training.classType}`) ?? training.classType

  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-sm transition-colors">
      {/* ── Collapsed Header ── */}
      <div
        className="cursor-pointer px-5 py-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Row 1: date/time + actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: date + time */}
          <div className="flex min-w-0 items-center gap-3">
            <span className="whitespace-nowrap text-sm font-semibold text-[var(--text-primary)] sm:hidden">
              {formatDateShort(training.sessionDate, locale)}
            </span>
            <span className="hidden whitespace-nowrap text-sm font-semibold text-[var(--text-primary)] sm:inline">
              {formatDate(training.sessionDate, locale)}
            </span>
            <span className="whitespace-nowrap text-xs text-[var(--text-subtle)]">
              {formatTime(training.sessionDate, locale)}
            </span>
          </div>

          {/* Right: actions + expand */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Duration */}
            <span className="whitespace-nowrap text-xs text-[var(--text-subtle)]">
              {training.durationMinutes}m
            </span>

            {/* Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/training/${training.id}/edit`)
              }}
              className="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              title={translate('history.edit')}
            >
              <PencilIcon />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              disabled={isDeleting}
              className="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] hover:text-rose-500 disabled:opacity-40"
              title={translate('history.delete')}
            >
              <TrashIcon />
            </button>

            {/* Expand toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="rounded-lg p-1 text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
            >
              {expanded ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Row 2: type / class badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
            {typeLabel}
          </span>
          {classLabel !== training.classType && (
            <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--text-subtle)]">
              {classLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Stats Bar (always visible) ── */}
      <div className="flex flex-wrap gap-6 border-t border-[var(--border-row)] px-5 py-2 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <span className="text-rose-500"><HeartIcon size={16} /></span> {translate('history.statCardio', { value: training.cardioRating })}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500"><ZapIcon size={16} /></span> {translate('history.statIntensity', { value: training.intensityRating })}
        </span>
        <span className="flex items-center gap-1">
          <CrosshairIcon size={16} /> {translate('history.statRolls', { count: training.totalRolls })}
        </span>
        {training.taps > 0 && (
          <span className="flex items-center gap-1">
            <TrophyIcon size={16} className="text-rose-500" /> {translate('history.statTaps', { count: training.taps })}
          </span>
        )}
        {training.submissions > 0 && (
          <span className="flex items-center gap-1">
            <TrophyIcon size={16} className="text-yellow-500" /> {translate('history.statSubs', { count: training.submissions })}
          </span>
        )}
        {training.escapes > 0 && (
          <span className="flex items-center gap-1">
            <ShieldIcon size={16} /> {translate('history.statEscapes', { count: training.escapes })}
          </span>
        )}
      </div>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div className="space-y-6 border-t border-[var(--border-row)] px-5 py-5">
          {/* Techniques */}
          {training.techniques.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                {translate('history.techniques')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {training.techniques.map((t) => (
                  <TechniqueBadge key={t.id} {...t} />
                ))}
              </div>
            </div>
          )}

          {/* Submissions made */}
          {training.submissionTechniques.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                {translate('history.submissionsMade')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {training.submissionTechniques.map((t) => (
                  <TechniqueBadge key={t.id} {...t} />
                ))}
              </div>
            </div>
          )}

          {/* Submissions allowed */}
          {training.submissionTechniquesAllowed.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">
                {translate('history.submissionsAllowed')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {training.submissionTechniquesAllowed.map((t) => (
                  <TechniqueBadge key={t.id} {...t} />
                ))}
              </div>
            </div>
          )}

          {/* Combat stats grid */}
          {(training.sweeps > 0 || training.takedowns > 0 || training.guardPasses > 0) && (
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                {translate('history.combatStats')}
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {training.sweeps > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.sweeps}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.sweeps')}</div>
                  </div>
                )}
                {training.takedowns > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.takedowns}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.takedowns')}</div>
                  </div>
                )}
                {training.guardPasses > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.guardPasses}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.guardPasses')}</div>
                  </div>
                )}
                {training.submissions > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.submissions}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.submissions')}</div>
                  </div>
                )}
                {training.taps > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.taps}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.taps')}</div>
                  </div>
                )}
                {training.escapes > 0 && (
                  <div className="rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-3 text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{training.escapes}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{translate('history.escapes')}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session info */}
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
            <div>
              <span className="text-[var(--text-subtle)]">{translate('history.duration')}</span>
              <p className="font-medium text-[var(--text-primary)]">{training.durationMinutes}m</p>
            </div>
            <div>
              <span className="text-[var(--text-subtle)]">{translate('history.roundLength')}</span>
              <p className="font-medium text-[var(--text-primary)]">{training.roundLengthMinutes}m</p>
            </div>
            <div>
              <span className="text-[var(--text-subtle)]">{translate('history.restLength')}</span>
              <p className="font-medium text-[var(--text-primary)]">{training.restLengthMinutes}m</p>
            </div>
            <div>
              <span className="text-[var(--text-subtle)]">{translate('history.totalRolls')}</span>
              <p className="font-medium text-[var(--text-primary)]">{training.totalRolls}</p>
            </div>
          </div>

          {/* Description */}
          {training.description && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                {translate('history.notes')}
              </h4>
              <p className="whitespace-pre-wrap rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] px-4 py-3 text-sm text-[var(--text-muted)]">
                {training.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page Size Selector ───────────────────────────────────
function PageSizeSelector({
  value, onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const { translate } = useTranslation()
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-1.5 text-xs text-[var(--text-muted)] outline-none"
    >
      {[10, 25, 50].map((s) => (
        <option key={s} value={s}>{translate('filter.perPage', { count: s })}</option>
      ))}
    </select>
  )
}

// ── Time presets ─────────────────────────────────────────
type Preset = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: '7d',     label: '7d' },
  { key: '30d',    label: '30d' },
  { key: '90d',    label: '90d' },
  { key: '1y',     label: '1y' },
  { key: 'custom', label: 'Custom' },
]

function presetToDates(preset: Preset): { startDate: string; endDate: string } {
  if (preset === 'all' || preset === 'custom') return { startDate: '', endDate: '' }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { startDate: start.toISOString().slice(0, 10), endDate: '' }
}

// ── Main History Page ────────────────────────────────────
export default function HistoryPage() {
  const { translate, locale } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(25)
  const [preset, setPreset] = useState<Preset>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedCustomStart, setAppliedCustomStart] = useState('')
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TrainingResponse | null>(null)

  // Promote the edited range to the "applied" range once it's valid. Done while
  // rendering (guarded so it only fires on an actual change) instead of in an
  // effect — the React-endorsed "adjust state during render" pattern.
  if (
    isApplicableRange(customStart, customEnd) &&
    (customStart !== appliedCustomStart || customEnd !== appliedCustomEnd)
  ) {
    setAppliedCustomStart(customStart)
    setAppliedCustomEnd(customEnd)
  }

  const hasError = preset === 'custom' && isOutOfOrderRange(customStart, customEnd)

  const { startDate, endDate } = preset === 'custom'
    ? { startDate: appliedCustomStart, endDate: appliedCustomEnd }
    : presetToDates(preset)

  const { data, isLoading, isError } = useTrainings(page, size, startDate || undefined, endDate || undefined)
  const deleteMutation = useDeleteTraining()

  const handlePreset = (p: Preset) => { setPreset(p); setPage(0) }
  const handleCustomStart = (v: string) => {
    if (hasYearOverflow(v)) return
    setCustomStart(v); setPage(0)
  }
  const handleCustomEnd = (v: string) => {
    if (hasYearOverflow(v)) return
    setCustomEnd(v); setPage(0)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      })
    }
  }

  const totalPages = data?.totalPages ?? 0
  const trainings = data?.content ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border-header)] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {translate('history.title')}
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">
            {data
              ? translate('history.count', { total: data.totalElements })
              : translate('history.loading')}
          </p>
        </div>
        <button
          onClick={() => navigate('/training/new')}
          className="whitespace-nowrap rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
        >
          {translate('nav.newTraining')}
        </button>
      </div>

      {/* Time range filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              preset === key
                ? 'bg-[var(--text-primary)] text-[var(--bg-page)]'
                : 'border border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {key === 'all' ? translate('filter.all') : key === 'custom' ? translate('filter.custom') : label}
          </button>
        ))}
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
            {hasError && (
              <span className="text-xs text-rose-500">
                {translate('filter.invalidRange')}
              </span>
            )}
          </div>
        )}
        </div>
        <PageSizeSelector value={size} onChange={(s) => { setSize(s); setPage(0) }} />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
              <div className="mb-3 h-5 w-48 rounded bg-[var(--bg-subtle)]" />
              <div className="h-4 w-32 rounded bg-[var(--bg-subtle)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-rose-400">{translate('history.error')}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && trainings.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-16 text-center">
          <div className="mb-4 inline-flex rounded-full bg-[var(--bg-subtle)] p-4 text-[var(--text-muted)]">
            <ActivityIcon size={16} />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
            {translate('history.emptyTitle')}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {translate('history.emptyDesc')}
          </p>
        </div>
      )}

      {/* Training list */}
      {!isLoading && trainings.length > 0 && (
        <div className="space-y-3">
          {trainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onDelete={() => setDeleteTarget(training)}
              isDeleting={deleteMutation.isPending && deleteTarget?.id === training.id}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {translate('history.prev')}
          </button>

          <span className="text-sm text-[var(--text-subtle)]">
            {translate('history.pageOf', { page: page + 1, total: totalPages })}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {translate('history.next')}
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={translate('history.confirmDeleteTitle')}
        message={translate('history.confirmDeleteMsg', {
          date: deleteTarget ? formatDate(deleteTarget.sessionDate, locale) : '',
        })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={translate('history.confirmDelete')}
        cancelLabel={translate('history.cancel')}
      />
    </div>
  )
}
