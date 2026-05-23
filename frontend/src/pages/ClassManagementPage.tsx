import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useClasses } from '../features/academy/hooks/useClasses'
import { useCancelClass } from '../features/academy/hooks/useClassMutations'
import { useTemplates } from '../features/academy/hooks/useTemplates'
import {
  useDeleteTemplate,
  useGenerateFromTemplate,
} from '../features/academy/hooks/useTemplateMutations'
import { AttendanceModal } from '../features/academy/components/AttendanceModal'
import {
  CalendarIcon,
  ChevronLeftIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
} from '../assets/icons'
import type { ClassTemplateResponse, ScheduledClassResponse } from '../types/api'

type Tab = 'classes' | 'templates'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-400',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-400',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  CANCELED: 'bg-rose-500/10 text-rose-400',
}

function toLocalDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
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

export default function ClassManagementPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id: academyId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const initialTab: Tab = searchParams.get('tab') === 'templates' ? 'templates' : 'classes'
  const [tab, setTab] = useState<Tab>(initialTab)

  const today = toLocalDateInput(new Date())
  const twoWeeksLater = toLocalDateInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(twoWeeksLater)

  // ── Classes state
  const { data: classesPage, isLoading: classesLoading, isError: classesError } = useClasses(
    academyId,
    { startDate, endDate },
  )
  const classes = classesPage?.content ?? []
  const cancelMutation = useCancelClass(academyId!)
  const [cancelTarget, setCancelTarget] = useState<ScheduledClassResponse | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<ScheduledClassResponse | null>(null)

  // ── Templates state
  const { data: templatesPage, isLoading: templatesLoading, isError: templatesError } =
    useTemplates(academyId)
  const templates = templatesPage?.content ?? []
  const deleteMutation = useDeleteTemplate(academyId!)
  const generateMutation = useGenerateFromTemplate(academyId!)
  const [deleteTarget, setDeleteTarget] = useState<ClassTemplateResponse | null>(null)
  const [generateTarget, setGenerateTarget] = useState<ClassTemplateResponse | null>(null)
  const [genStart, setGenStart] = useState(today)
  const [genEnd, setGenEnd] = useState(twoWeeksLater)
  const [generateError, setGenerateError] = useState('')

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

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
          setTab('classes')
        },
        onError: () => setGenerateError(translate('template.generateError')),
      },
    )
  }

  const previewCount = generateTarget
    ? countGeneratedClasses(generateTarget, genStart, genEnd)
    : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <button
        onClick={() => navigate(`/academies/${academyId}`)}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.backToList').replace('academies', 'academy')}
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {translate('academy.manageClasses')}
        </h1>
        {tab === 'classes' ? (
          <button
            onClick={() => navigate(`/academies/${academyId}/classes/new`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
          >
            <PlusIcon size={14} />
            {translate('class.new')}
          </button>
        ) : (
          <button
            onClick={() => navigate(`/academies/${academyId}/templates/new`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
          >
            <PlusIcon size={14} />
            {translate('template.new')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-header)]">
        {(['classes', 'templates'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
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

      {/* ── Classes Tab ─────────────────────────────────────── */}
      {tab === 'classes' && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">{translate('form.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">{translate('form.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </div>
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
        </div>
      )}

      {/* ── Templates Tab ────────────────────────────────────── */}
      {tab === 'templates' && (
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

      {/* ── Attendance Modal ────────────────────────────────── */}
      {attendanceTarget && academyId && (
        <AttendanceModal
          academyId={academyId}
          cls={attendanceTarget}
          onClose={() => setAttendanceTarget(null)}
        />
      )}

      {/* ── Cancel Class Modal ───────────────────────────────── */}
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

      {/* ── Delete Template Modal ────────────────────────────── */}
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

      {/* ── Generate Classes Modal ───────────────────────────── */}
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
