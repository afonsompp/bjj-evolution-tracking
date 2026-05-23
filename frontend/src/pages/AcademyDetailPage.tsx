import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AcademyMenberClassViewResponse } from '../types/api'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useProfile } from '../features/profile/useProfile'
import { useAcademy } from '../features/academy/hooks/useAcademy'
import { useMembership } from '../features/academy/hooks/useMembership'
import { useAcademySchedule } from '../features/academy/hooks/useAcademySchedule'
import { useJoinAcademy, useLeaveAcademy } from '../features/academy/hooks/useJoinAcademy'
import { useMyAttendances } from '../features/academy/hooks/useAttendance'
import { useSelfCheckIn, useCancelMyCheckIn } from '../features/academy/hooks/useAttendanceMutations'
import { AcademyPermissionGate } from '../features/academy/permissions/AcademyPermissionGate'
import { PendingRequestsPanel } from '../features/academy/components/PendingRequestsPanel'
import {
  BuildingIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  DownloadIcon,
  LoaderIcon,
  MapPinIcon,
  CheckCircleIcon,
  HourglassIcon,
  UsersIcon,
  LogOutIcon,
  PencilIcon,
  XIcon,
} from '../assets/icons'

type Tab = 'info' | 'schedule'

export default function AcademyDetailPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('info')
  const [actionError, setActionError] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const { data: academy, isLoading: academyLoading, isError: academyError } = useAcademy(id)
  const { data: profile } = useProfile()
  const { data: membership, isLoading: membershipLoading } = useMembership(id, profile?.id)

  const isMember = membership?.status === 'ACTIVE'
  const isPending = membership?.status === 'PENDING'
  const isOwner = membership?.role === 'OWNER'

  const { data: schedulePage, isLoading: scheduleLoading } = useAcademySchedule(id, isMember)
  const { data: myAttendancesPage } = useMyAttendances(id, isMember)
  const myAttendanceMap = useMemo(() => {
    const map: Record<number, AcademyMenberClassViewResponse> = {}
    myAttendancesPage?.content.forEach((a) => { map[a.scheduledClass.id] = a })
    return map
  }, [myAttendancesPage])

  const selfCheckIn = useSelfCheckIn(id ?? '')
  const cancelCheckIn = useCancelMyCheckIn(id ?? '')

  const joinMutation = useJoinAcademy(id)
  const leaveMutation = useLeaveAcademy(id)

  const handleJoin = () => {
    setActionError('')
    joinMutation.mutate(undefined, {
      onError: () => setActionError(translate('academy.joinError')),
    })
  }

  const handleLeave = () => {
    setActionError('')
    leaveMutation.mutate(undefined, {
      onSuccess: () => setShowLeaveConfirm(false),
      onError: () => setActionError(translate('academy.leaveError')),
    })
  }

  const now = new Date().toISOString()
  const upcomingClasses =
    schedulePage?.content.filter(
      (c) => c.status === 'PUBLISHED' && c.startTime > now,
    ) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate('/academies')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.backToList')}
      </button>

      {/* Loading */}
      {academyLoading && (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon size={24} className="text-[var(--text-muted)]" />
        </div>
      )}

      {/* Error */}
      {academyError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-rose-400">{translate('academy.errorLoadDetail')}</p>
        </div>
      )}

      {academy && (
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <BuildingIcon size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{academy.name}</h1>
                {academy.address && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <MapPinIcon size={14} />
                    <span>{academy.address}</span>
                  </div>
                )}
              </div>
              {id && (
                <AcademyPermissionGate academyId={id} require="canEditAcademy">
                  <button
                    onClick={() => navigate(`/academies/${id}/settings`)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <PencilIcon size={12} />
                    {translate('academy.settings')}
                  </button>
                </AcademyPermissionGate>
              )}
            </div>

            {/* Membership action */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {membershipLoading ? (
                <span className="text-xs text-[var(--text-subtle)]">
                  <LoaderIcon size={14} className="inline" />
                </span>
              ) : isMember ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <CheckCircleIcon size={14} />
                    {translate('academy.alreadyMember')}
                  </span>
                  {!isOwner && (
                    <button
                      onClick={() => {
                        setActionError('')
                        setShowLeaveConfirm(true)
                      }}
                      disabled={leaveMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {leaveMutation.isPending ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                      ) : (
                        <LogOutIcon size={12} />
                      )}
                      {translate('academy.leave')}
                    </button>
                  )}
                </>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  <HourglassIcon size={14} />
                  {translate('academy.pendingApproval')}
                </span>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joinMutation.isPending}
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
                >
                  {joinMutation.isPending
                    ? translate('form.saving')
                    : translate('academy.requestJoin')}
                </button>
              )}
              {actionError && (
                <span className="text-xs text-rose-400">{actionError}</span>
              )}
              {joinMutation.isSuccess && !isMember && !isPending && (
                <span className="text-xs text-emerald-400">{translate('academy.joinSent')}</span>
              )}
            </div>

            {/* Leave confirmation modal */}
            {showLeaveConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-lg">
                  <p className="text-sm text-[var(--text-primary)]">
                    {translate('academy.leaveConfirm', { name: academy.name })}
                  </p>
                  {leaveMutation.isError && (
                    <p className="mt-2 text-xs text-rose-400">{translate('academy.leaveError')}</p>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {translate('history.cancel')}
                    </button>
                    <button
                      onClick={handleLeave}
                      disabled={leaveMutation.isPending}
                      className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                    >
                      {translate('academy.leave')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs (only for active members) */}
          {isMember && (
            <div className="flex gap-2 border-b border-[var(--border-header)]">
              <button
                onClick={() => setTab('info')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tab === 'info'
                    ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {translate('academy.info')}
              </button>
              <button
                onClick={() => setTab('schedule')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tab === 'schedule'
                    ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {translate('academy.schedule')}
              </button>
            </div>
          )}

          {/* Info tab (default for non-members too) */}
          {(tab === 'info' || !isMember) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium text-[var(--text-muted)]">{translate('academy.infoName')}</h3>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{academy.name}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium text-[var(--text-muted)]">{translate('academy.infoAddress')}</h3>
                <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{academy.address || '-'}</p>
              </div>
            </div>
          )}

          {/* Management section — only for users with canManageClasses */}
          {id && (
            <AcademyPermissionGate academyId={id} require="canManageClasses">
              <button
                onClick={() => navigate(`/academies/${id}/classes`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <CalendarIcon size={12} />
                {translate('academy.manageClasses')}
              </button>
            </AcademyPermissionGate>
          )}

          {/* Management section — only for users with canManageMembers */}
          {id && (
            <AcademyPermissionGate academyId={id} require="canManageMembers">
              <div className="space-y-4">
                <button
                  onClick={() => navigate(`/academies/${id}/members`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <UsersIcon size={12} />
                  {translate('members.manageMembers')}
                </button>
                <PendingRequestsPanel academyId={id} />
              </div>
            </AcademyPermissionGate>
          )}

          {/* Schedule tab */}
          {isMember && tab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {translate('academy.nextClasses')}
              </h2>

              {scheduleLoading && (
                <div className="flex items-center justify-center py-12">
                  <LoaderIcon size={24} className="text-[var(--text-muted)]" />
                </div>
              )}

              {!scheduleLoading && upcomingClasses.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-10 text-center">
                  <CalendarIcon size={32} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                  <p className="text-sm text-[var(--text-muted)]">
                    {translate('academy.noSchedule')}
                  </p>
                </div>
              )}

              {!scheduleLoading && upcomingClasses.length > 0 && (
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
                            <UsersIcon size={12} />
                            {c.instructor.name}
                          </span>
                          <span>{c.durationMinutes} {translate('form.minutes')}</span>
                        </div>
                        {/* Check-in status */}
                        <div className="mt-2">
                          {(() => {
                            const att = myAttendanceMap[c.id]
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
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title={translate('class.importToTraining')}
                      >
                        <DownloadIcon size={12} />
                        {translate('class.importToTraining')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
