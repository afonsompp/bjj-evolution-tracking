import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { MAX_DATE, hasYearOverflow, isApplicableRange, isOutOfOrderRange } from '../../../lib/dateValidation'
import { useClasses } from '../hooks/useClasses'
import { useCancelClass } from '../hooks/useClassMutations'
import { useTemplates } from '../hooks/useTemplates'
import {
  useDeleteTemplate,
  useGenerateFromTemplate,
} from '../hooks/useTemplateMutations'
import { AttendanceModal } from '../components/AttendanceModal'
import {
  CalendarIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
} from '../../../assets/icons'
import type { ClassTemplateResponse, ScheduledClassResponse } from '../../../types/api'

type SubTab = 'classes' | 'templates'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-400',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-400',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  CANCELED: 'bg-rose-500/10 text-rose-400',
}

function toLocalDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

type Preset = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: '7d',     label: '7d' },
  { key: '30d',    label: '30d' },
  { key: '90d',    label: '90d' },
  { key: '1y',     label: '1y' },
  { key: 'custom', label: 'Custom' },
]

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function presetRange(preset: Preset): { startDate: string; endDate: string } {
  if (preset === 'custom') return { startDate: '', endDate: '' }
  if (preset === 'all') return { startDate: isoDateOffset(-365 * 10), endDate: isoDateOffset(365 * 5) }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  // The agenda shows past and upcoming classes, so the window spans both directions around today.
  return { startDate: isoDateOffset(-days), endDate: isoDateOffset(days) }
}

function countGeneratedClasses(
  template: ClassTemplateResponse,
  startDate: string,
  endDate: string,
): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) return 0
  let count = 0
  const cursor = new Date(start)
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  while (cursor <= end) {
    const dow = dayNames[cursor.getDay()]
    count += template.recurrenceRules.filter((r) => r.dayOfWeek === dow).length
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

type Props = { academyId: string }

export function ClassesSection({ academyId }: Props) {
  const { translate } = useTranslation()
  const navigate = useNavigate()

  const [subTab, setSubTab] = useState<SubTab>('classes')

  const today = toLocalDateInput(new Date())
  const twoWeeksLater = toLocalDateInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))

  const [preset, setPreset] = useState<Preset>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedCustomStart, setAppliedCustomStart] = useState('')
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(25)

  useEffect(() => {
    if (isApplicableRange(customStart, customEnd)) {
      setAppliedCustomStart(customStart)
      setAppliedCustomEnd(customEnd)
    }
  }, [customStart, customEnd])

  const hasError = preset === 'custom' && isOutOfOrderRange(customStart, customEnd)

  const { startDate, endDate } = preset === 'custom'
    ? { startDate: appliedCustomStart, endDate: appliedCustomEnd }
    : presetRange(preset)

  const { data: classesPage, isLoading: classesLoading, isError: classesError } = useClasses(
    academyId,
    { startDate: startDate || undefined, endDate: endDate || undefined, page, size },
  )
  const classes = classesPage?.content ?? []
  const totalPages = classesPage?.totalPages ?? 0

  const handlePreset = (p: Preset) => { setPreset(p); setPage(0) }
  const handleCustomStart = (v: string) => {
    if (hasYearOverflow(v)) return
    setCustomStart(v); setPage(0)
  }
  const handleCustomEnd = (v: string) => {
    if (hasYearOverflow(v)) return
    setCustomEnd(v); setPage(0)
  }
  const cancelMutation = useCancelClass(academyId)
  const [cancelTarget, setCancelTarget] = useState<ScheduledClassResponse | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<ScheduledClassResponse | null>(null)

  const { data: templatesPage, isLoading: templatesLoading, isError: templatesError } =
    useTemplates(academyId)
  const templates = templatesPage?.content ?? []
  const deleteMutation = useDeleteTemplate(academyId)
  const generateMutation = useGenerateFromTemplate(academyId)
  const [deleteTarget, setDeleteTarget] = useState<ClassTemplateResponse | null>(null)
  const [generateTarget, setGenerateTarget] = useState<ClassTemplateResponse | null>(null)
  const [genStart, setGenStart] = useState(today)
  const [genEnd, setGenEnd] = useState(twoWeeksLater)
  const [generateError, setGenerateError] = useState('')

  const handleCancelClass = () => {
    if (!cancelTarget) return
    cancelMutation.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    })
  }

  const handleDeleteTemplate = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const handleGenerate = () => {
    if (!generateTarget) return
    setGenerateError('')
    generateMutation.mutate(
      { templateId: generateTarget.id, body: { startDate: genStart, endDate: genEnd } },
      {
        onSuccess: () => {
          setGenerateTarget(null)
          setSubTab('classes')
        },
        onError: () => setGenerateError(translate('template.generateError')),
      },
    )
  }

  const previewCount = generateTarget
    ? countGeneratedClasses(generateTarget, genStart, genEnd)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-2 border-b border-[var(--border-header)]">
        <div className="flex min-w-0 gap-1 overflow-x-auto sm:gap-2">
          {(['classes', 'templates'] as SubTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                subTab === t
                  ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t === 'classes'
                ? translate('academy.schedule')
                : translate('academy.templates')}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            navigate(
              subTab === 'classes'
                ? `/academies/${academyId}/classes/new`
                : `/academies/${academyId}/templates/new`,
            )
          }
          className="mb-1.5 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 sm:px-3"
          title={subTab === 'classes' ? translate('class.new') : translate('template.new')}
        >
          <PlusIcon size={12} />
          <span className="hidden sm:inline">
            {subTab === 'classes' ? translate('class.new') : translate('template.new')}
          </span>
        </button>
      </div>

      {subTab === 'classes' && (
        <div className="space-y-4">
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
                  {label}
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
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
              className="rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-1.5 text-xs text-[var(--text-muted)] outline-none"
            >
              {[10, 25, 50].map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>

          {classesLoading && (
            <div className="flex justify-center py-12">
              <LoaderIcon size={24} className="text-[var(--text-muted)]" />
            </div>
          )}

          {classesError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
              {translate('class.error')}
            </div>
          )}

          {!classesLoading && classes.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-12 text-center">
              <CalendarIcon size={28} className="mx-auto mb-2 text-[var(--text-subtle)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {translate('class.emptyTitle')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {translate('class.emptyDesc')}
              </p>
            </div>
          )}

          {!classesLoading && classes.length > 0 && (
            <div className="space-y-2">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {translate(`form.classType.${c.classType}`)} · {c.trainingType}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}
                      >
                        {translate(`class.status.${c.status}`)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {new Date(c.startTime).toLocaleString()} · {c.durationMinutes}{' '}
                      {translate('form.minutes')} · {c.instructor.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setAttendanceTarget(c)}
                      className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title={translate('attendance.attendance')}
                    >
                      <UsersIcon size={13} />
                    </button>
                    {c.status !== 'COMPLETED' && c.status !== 'CANCELED' && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/academies/${academyId}/classes/${c.id}/edit`)
                          }
                          className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <PencilIcon size={13} />
                        </button>
                        <button
                          onClick={() => setCancelTarget(c)}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                        >
                          <XIcon size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
        </div>
      )}

      {subTab === 'templates' && (
        <div className="space-y-4">
          {templatesLoading && (
            <div className="flex justify-center py-12">
              <LoaderIcon size={24} className="text-[var(--text-muted)]" />
            </div>
          )}

          {templatesError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
              {translate('template.error')}
            </div>
          )}

          {!templatesLoading && templates.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-12 text-center">
              <CalendarIcon size={28} className="mx-auto mb-2 text-[var(--text-subtle)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {translate('template.emptyTitle')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {translate('template.emptyDesc')}
              </p>
            </div>
          )}

          {!templatesLoading && templates.length > 0 && (
            <div className="space-y-2">
              {templates.map((t) => {
                const recurrenceSummary = t.recurrenceRules
                  .map((r) => `${translate(`dayOfWeek.${r.dayOfWeek}`).slice(0, 3)} ${r.startTime.slice(0, 5)}`)
                  .join(' · ')
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {translate(`form.classType.${t.classType}`)} · {t.trainingType} ·{' '}
                        {t.durationMinutes} {translate('form.minutes')} · {t.instructor.name}
                      </p>
                      {recurrenceSummary && (
                        <p className="mt-0.5 text-xs text-[var(--text-subtle)]">
                          {recurrenceSummary}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          setGenerateTarget(t)
                          setGenStart(today)
                          setGenEnd(twoWeeksLater)
                          setGenerateError('')
                        }}
                        className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title={translate('template.generate')}
                      >
                        <CalendarIcon size={13} />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/academies/${academyId}/templates/${t.id}/edit`)
                        }
                        className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <PencilIcon size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {attendanceTarget && (
        <AttendanceModal
          academyId={academyId}
          cls={attendanceTarget}
          onClose={() => setAttendanceTarget(null)}
        />
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-sm text-[var(--text-primary)]">
              {translate('class.cancelConfirm')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {translate('form.cancel')}
              </button>
              <button
                onClick={handleCancelClass}
                disabled={cancelMutation.isPending}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {translate('class.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-sm text-[var(--text-primary)]">
              {translate('template.deleteConfirm')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {translate('form.cancel')}
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {translate('template.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {generateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {translate('template.generateTitle')}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{generateTarget.name}</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--text-primary)]">
                  {translate('form.startDate')}
                </label>
                <input
                  type="date"
                  value={genStart}
                  onChange={(e) => setGenStart(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--text-primary)]">
                  {translate('form.endDate')}
                </label>
                <input
                  type="date"
                  value={genEnd}
                  onChange={(e) => setGenEnd(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
                />
              </div>
              {genStart && genEnd && (
                <p className="text-xs font-medium text-emerald-400">
                  {translate('template.willGenerate', { count: previewCount })}
                </p>
              )}
              {generateError && (
                <p className="text-xs text-rose-400">{generateError}</p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setGenerateTarget(null)}
                className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {translate('form.cancel')}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || previewCount === 0}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <LoaderIcon size={12} className="inline animate-spin" />
                ) : (
                  translate('template.generate')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
