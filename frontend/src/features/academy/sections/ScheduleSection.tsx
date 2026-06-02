import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AcademyMenberClassViewResponse } from '../../../types/api'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { MAX_DATE, hasYearOverflow, isApplicableRange, isOutOfOrderRange } from '../../../lib/dateValidation'
import { useProfile } from '../../profile/useProfile'
import { useAcademySchedule } from '../hooks/useAcademySchedule'
import { useMyAttendances } from '../hooks/useAttendance'
import { useSelfCheckIn, useCancelMyCheckIn } from '../hooks/useAttendanceMutations'
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  LoaderIcon,
  CheckCircleIcon,
  HourglassIcon,
  XIcon,
} from '../../../assets/icons'
import { Avatar } from '../../../components/Avatar'

type Preset = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: '7d',     label: '7d' },
  { key: '30d',    label: '30d' },
  { key: '90d',    label: '90d' },
  { key: '1y',     label: '1y' },
  { key: 'custom', label: 'Custom' },
]

function daysForPreset(preset: Preset): number {
  switch (preset) {
    case 'all': return 365 * 10
    case '7d':  return 7
    case '30d': return 30
    case '90d': return 90
    case '1y':  return 365
    default:    return 0
  }
}

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function pastWindow(preset: Preset, customStart: string, customEnd: string) {
  if (preset === 'custom') {
    return {
      startISO: customStart || isoDateOffset(-365 * 10),
      endISO: customEnd || isoDateOffset(0),
    }
  }
  return { startISO: isoDateOffset(-daysForPreset(preset)), endISO: isoDateOffset(0) }
}

function futureWindow(preset: Preset, customStart: string, customEnd: string) {
  if (preset === 'custom') {
    return {
      startISO: customStart || isoDateOffset(0),
      endISO: customEnd || isoDateOffset(365 * 5),
    }
  }
  return { startISO: isoDateOffset(0), endISO: isoDateOffset(daysForPreset(preset)) }
}

function PresetFilter({
  value, onChange, customStart, customEnd, onCustomStart, onCustomEnd, errorMessage,
}: {
  value: Preset
  onChange: (p: Preset) => void
  customStart: string
  customEnd: string
  onCustomStart: (v: string) => void
  onCustomEnd: (v: string) => void
  errorMessage?: string
}) {
  const { translate } = useTranslation()
  const invalid = !!errorMessage
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === key
              ? 'bg-[var(--text-primary)] text-[var(--bg-page)]'
              : 'border border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          {key === 'all' ? translate('filter.all') : key === 'custom' ? translate('filter.custom') : label}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            value={customStart}
            max={customEnd || MAX_DATE}
            onChange={(e) => onCustomStart(e.target.value)}
            className={`rounded-md border bg-[var(--bg-select)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] ${
              invalid ? 'border-rose-500' : 'border-[var(--border-select)]'
            }`}
          />
          <span className="text-xs text-[var(--text-subtle)]">—</span>
          <input
            type="date"
            value={customEnd}
            min={customStart || undefined}
            max={MAX_DATE}
            onChange={(e) => onCustomEnd(e.target.value)}
            className={`rounded-md border bg-[var(--bg-select)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] ${
              invalid ? 'border-rose-500' : 'border-[var(--border-select)]'
            }`}
          />
          {errorMessage && (
            <span className="text-xs text-rose-500">{errorMessage}</span>
          )}
        </div>
      )}
    </div>
  )
}

function PageSizeSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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

function Pagination({
  page, totalPages, onChange, prevLabel, nextLabel, pageOfLabel,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  prevLabel: string
  nextLabel: string
  pageOfLabel: string
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {prevLabel}
      </button>
      <span className="text-sm text-[var(--text-subtle)]">{pageOfLabel}</span>
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {nextLabel}
      </button>
    </div>
  )
}

type Props = { academyId: string }

export function ScheduleSection({ academyId }: Props) {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { data: profile } = useProfile()

  const [upcomingPreset, setUpcomingPreset] = useState<Preset>('90d')
  const [upcomingCustomStart, setUpcomingCustomStart] = useState('')
  const [upcomingCustomEnd, setUpcomingCustomEnd] = useState('')
  const [appliedUpcomingStart, setAppliedUpcomingStart] = useState('')
  const [appliedUpcomingEnd, setAppliedUpcomingEnd] = useState('')
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [upcomingSize, setUpcomingSize] = useState(25)

  const [pastPreset, setPastPreset] = useState<Preset>('7d')
  const [pastCustomStart, setPastCustomStart] = useState('')
  const [pastCustomEnd, setPastCustomEnd] = useState('')
  const [appliedPastStart, setAppliedPastStart] = useState('')
  const [appliedPastEnd, setAppliedPastEnd] = useState('')
  const [pastPage, setPastPage] = useState(0)
  const [pastSize, setPastSize] = useState(25)

  // Promote each edited range to its "applied" range once valid. Done while
  // rendering (guarded so it only fires on an actual change) instead of in an
  // effect — the React-endorsed "adjust state during render" pattern.
  if (
    isApplicableRange(upcomingCustomStart, upcomingCustomEnd) &&
    (upcomingCustomStart !== appliedUpcomingStart || upcomingCustomEnd !== appliedUpcomingEnd)
  ) {
    setAppliedUpcomingStart(upcomingCustomStart)
    setAppliedUpcomingEnd(upcomingCustomEnd)
  }

  if (
    isApplicableRange(pastCustomStart, pastCustomEnd) &&
    (pastCustomStart !== appliedPastStart || pastCustomEnd !== appliedPastEnd)
  ) {
    setAppliedPastStart(pastCustomStart)
    setAppliedPastEnd(pastCustomEnd)
  }

  const upcomingRange = futureWindow(upcomingPreset, appliedUpcomingStart, appliedUpcomingEnd)
  const pastRange = pastWindow(pastPreset, appliedPastStart, appliedPastEnd)

  const upcomingHasError = upcomingPreset === 'custom'
    && isOutOfOrderRange(upcomingCustomStart, upcomingCustomEnd)
  const pastHasError = pastPreset === 'custom'
    && isOutOfOrderRange(pastCustomStart, pastCustomEnd)

  const { data: upcomingPageData, isLoading: upcomingLoading } = useAcademySchedule(
    academyId, true, upcomingRange.startISO, upcomingRange.endISO, upcomingPage, upcomingSize,
  )
  const { data: pastPageData, isLoading: pastLoading } = useAcademySchedule(
    academyId, true, pastRange.startISO, pastRange.endISO, pastPage, pastSize,
  )

  const { data: myAttendancesPage } = useMyAttendances(academyId, true)
  const myAttendanceMap = useMemo(() => {
    const map: Record<number, AcademyMenberClassViewResponse> = {}
    myAttendancesPage?.content.forEach((a) => { map[a.scheduledClass.id] = a })
    return map
  }, [myAttendancesPage])

  const selfCheckIn = useSelfCheckIn(academyId)
  const cancelCheckIn = useCancelMyCheckIn(academyId)

  const nowMs = new Date().getTime()
  const upcomingClasses =
    upcomingPageData?.content.filter(
      (c) => c.status === 'PUBLISHED' && new Date(c.startTime).getTime() > nowMs,
    ) ?? []
  const upcomingTotalPages = upcomingPageData?.totalPages ?? 0

  const pastClasses =
    pastPageData?.content.filter((c) => {
      const endMs = new Date(c.startTime).getTime() + c.durationMinutes * 60_000
      return endMs <= nowMs
    }) ?? []
  const pastTotalPages = pastPageData?.totalPages ?? 0

  const handleUpcomingPreset = (p: Preset) => { setUpcomingPreset(p); setUpcomingPage(0) }
  const handleUpcomingCustomStart = (v: string) => {
    if (hasYearOverflow(v)) return
    setUpcomingCustomStart(v); setUpcomingPage(0)
  }
  const handleUpcomingCustomEnd = (v: string) => {
    if (hasYearOverflow(v)) return
    setUpcomingCustomEnd(v); setUpcomingPage(0)
  }
  const handlePastPreset = (p: Preset) => { setPastPreset(p); setPastPage(0) }
  const handlePastCustomStart = (v: string) => {
    if (hasYearOverflow(v)) return
    setPastCustomStart(v); setPastPage(0)
  }
  const handlePastCustomEnd = (v: string) => {
    if (hasYearOverflow(v)) return
    setPastCustomEnd(v); setPastPage(0)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {translate('academy.nextClasses')}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PresetFilter
          value={upcomingPreset}
          onChange={handleUpcomingPreset}
          customStart={upcomingCustomStart}
          customEnd={upcomingCustomEnd}
          onCustomStart={handleUpcomingCustomStart}
          onCustomEnd={handleUpcomingCustomEnd}
          errorMessage={upcomingHasError ? translate('filter.invalidRange') : undefined}
        />
        <PageSizeSelector
          value={upcomingSize}
          onChange={(s) => { setUpcomingSize(s); setUpcomingPage(0) }}
        />
      </div>

      {upcomingLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon size={24} className="text-[var(--text-muted)]" />
        </div>
      )}

      {!upcomingLoading && upcomingClasses.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-10 text-center">
          <CalendarIcon size={32} className="mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="text-sm text-[var(--text-muted)]">
            {translate('academy.noSchedule')}
          </p>
        </div>
      )}

      {!upcomingLoading && upcomingClasses.length > 0 && (
        <div className="space-y-3">
          {upcomingClasses.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <CalendarIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {translate(`form.classType.${c.classType}`)}
                  </p>
                  <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                    {c.trainingType}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <ClockIcon size={12} />
                    {new Date(c.startTime).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Avatar photoUrl={c.instructor.photoUrl} name={c.instructor.name} size={16} />
                    {c.instructor.name}
                  </span>
                  <span>{c.durationMinutes} {translate('form.minutes')}</span>
                </div>
                <div className="mt-2">
                  {(() => {
                    const att = myAttendanceMap[c.id]
                    if (profile?.id === c.instructor.id) {
                      return (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                          {translate('academy.instructor')}
                        </span>
                      )
                    }
                    if (att?.status === 'CONFIRMED') {
                      return (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          <CheckCircleIcon size={11} />
                          {translate('attendance.status.CONFIRMED')}
                        </span>
                      )
                    }
                    if (att?.status === 'REGISTERED') {
                      return (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                            <HourglassIcon size={11} />
                            {translate('attendance.status.REGISTERED')}
                          </span>
                          <button
                            onClick={() => cancelCheckIn.mutate(c.id)}
                            disabled={cancelCheckIn.isPending && cancelCheckIn.variables === c.id}
                            className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-rose-400"
                          >
                            <XIcon size={11} />
                            {translate('attendance.cancelCheckIn')}
                          </button>
                        </span>
                      )
                    }
                    if (att?.status === 'CANCELED') {
                      return (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-400">
                          {translate('attendance.status.CANCELED')}
                        </span>
                      )
                    }
                    return (
                      <button
                        onClick={() => selfCheckIn.mutate(c.id)}
                        disabled={selfCheckIn.isPending && selfCheckIn.variables === c.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
                      >
                        {selfCheckIn.isPending && selfCheckIn.variables === c.id ? (
                          <LoaderIcon size={11} className="animate-spin" />
                        ) : (
                          <CheckCircleIcon size={11} />
                        )}
                        {translate('attendance.checkIn')}
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={upcomingPage}
        totalPages={upcomingTotalPages}
        onChange={setUpcomingPage}
        prevLabel={translate('history.prev')}
        nextLabel={translate('history.next')}
        pageOfLabel={translate('history.pageOf', {
          page: upcomingPage + 1,
          total: upcomingTotalPages,
        })}
      />

      <h2 className="pt-4 text-lg font-semibold text-[var(--text-primary)]">
        {translate('academy.history')}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PresetFilter
          value={pastPreset}
          onChange={handlePastPreset}
          customStart={pastCustomStart}
          customEnd={pastCustomEnd}
          onCustomStart={handlePastCustomStart}
          onCustomEnd={handlePastCustomEnd}
          errorMessage={pastHasError ? translate('filter.invalidRange') : undefined}
        />
        <PageSizeSelector
          value={pastSize}
          onChange={(s) => { setPastSize(s); setPastPage(0) }}
        />
      </div>

      {pastLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon size={24} className="text-[var(--text-muted)]" />
        </div>
      )}

      {!pastLoading && pastClasses.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-10 text-center">
          <CalendarIcon size={32} className="mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="text-sm text-[var(--text-muted)]">
            {translate('academy.noHistory')}
          </p>
        </div>
      )}

      {!pastLoading && pastClasses.length > 0 && (
        <div className="space-y-3">
          {pastClasses.map((c) => {
            const att = myAttendanceMap[c.id]
            const isInstructor = profile?.id === c.instructor.id
            const canImport = isInstructor || att?.status === 'CONFIRMED'
            return (
              <div
                key={c.id}
                className="flex items-start gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <CalendarIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {translate(`form.classType.${c.classType}`)}
                    </p>
                    <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                      {c.trainingType}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <ClockIcon size={12} />
                      {new Date(c.startTime).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Avatar photoUrl={c.instructor.photoUrl} name={c.instructor.name} size={16} />
                      {c.instructor.name}
                    </span>
                    <span>{c.durationMinutes} {translate('form.minutes')}</span>
                  </div>
                  <div className="mt-2">
                    {isInstructor ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                        {translate('academy.instructor')}
                      </span>
                    ) : att?.status === 'CONFIRMED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                        <CheckCircleIcon size={11} />
                        {translate('attendance.status.CONFIRMED')}
                      </span>
                    ) : att?.status === 'REGISTERED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                        {translate('attendance.status.REGISTERED')}
                      </span>
                    ) : att?.status === 'CANCELED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-400">
                        {translate('attendance.status.CANCELED')}
                      </span>
                    ) : null}
                  </div>
                </div>
                {canImport && (
                  <button
                    onClick={() => navigate('/training/new', {
                      state: {
                        fromClass: {
                          classType: c.classType,
                          trainingType: c.trainingType,
                          durationMinutes: c.durationMinutes,
                          startTime: c.startTime,
                          techniqueIds: c.scheduledTechniques.map((t) => t.id),
                        },
                      },
                    })}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] p-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:px-2.5"
                    title={translate('class.importToTraining')}
                    aria-label={translate('class.importToTraining')}
                  >
                    <DownloadIcon size={12} />
                    <span className="hidden sm:inline">{translate('class.importToTraining')}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination
        page={pastPage}
        totalPages={pastTotalPages}
        onChange={setPastPage}
        prevLabel={translate('history.prev')}
        nextLabel={translate('history.next')}
        pageOfLabel={translate('history.pageOf', {
          page: pastPage + 1,
          total: pastTotalPages,
        })}
      />
    </div>
  )
}
