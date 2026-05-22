import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useTranslation } from '../lib/i18n/I18nContext'
import type {
  AcademyResponse,
  AcademyMemberResponse,
  ProfileResponse,
  ScheduledClassResponse,
  Page,
} from '../types/api'
import {
  BuildingIcon,
  ChevronLeftIcon,
  LoaderIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  HourglassIcon,
  UsersIcon,
  LogOutIcon,
} from '../assets/icons'

type Tab = 'info' | 'schedule'

export default function AcademyDetailPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('info')
  const [joinError, setJoinError] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // ── Academy detail ────────────────────────────────────────
  const {
    data: academy,
    isLoading: academyLoading,
    isError: academyError,
  } = useQuery({
    queryKey: ['academy', id],
    queryFn: () =>
      apiClient.get<AcademyResponse>(`/academies/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  // ── Current user profile (for userId) ──────────────────
  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: () => apiClient.get<ProfileResponse>('/profiles').then((r) => r.data),
    retry: false,
  })

  // ── Membership status ───────────────────────────────────
  const {
    data: membership,
    isLoading: membershipLoading,
  } = useQuery<AcademyMemberResponse>({
    queryKey: ['academy-member', id, profile?.id],
    queryFn: () =>
      apiClient
        .get<AcademyMemberResponse>(`/academies/${id}/members/${profile!.id}`)
        .then((r) => r.data),
    enabled: !!id && !!profile?.id,
    retry: false,
  })

  // ── Join mutation ────────────────────────────────────────
  const joinMutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<AcademyMemberResponse>(`/academies/${id}/members/join`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-member', id] })
      queryClient.invalidateQueries({ queryKey: ['academy-memberships'] })
      setJoinError('')
    },
    onError: () => {
      setJoinError(translate('academy.joinError'))
    },
  })

  // ── Leave mutation ──────────────────────────────────────
  const leaveMutation = useMutation({
    mutationFn: () =>
      apiClient.delete(`/academies/${id}/members/me`).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-member', id] })
      queryClient.invalidateQueries({ queryKey: ['academy-memberships'] })
      setShowLeaveConfirm(false)
    },
    onError: () => {
      setJoinError(translate('academy.leaveError'))
    },
  })

  // ── Schedule (only if ACTIVE member) ───────────────────────
  const {
    data: schedulePage,
    isLoading: scheduleLoading,
  } = useQuery<Page<ScheduledClassResponse>>({
    queryKey: ['academy-classes', id],
    queryFn: () => {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      return apiClient
        .get<Page<ScheduledClassResponse>>(`/academies/${id}/classes`, {
          params: { startDate: start, endDate: end, size: 20 },
        })
        .then((r) => r.data)
    },
    enabled: !!id && membership?.status === 'ACTIVE',
  })

  const isMember = membership?.status === 'ACTIVE'
  const isPending = membership?.status === 'PENDING'

  const now = new Date().toISOString()
  const upcomingClasses =
    schedulePage?.content.filter(
      (c) =>
        c.status === 'PUBLISHED' &&
        c.startTime > now
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
                  <button
                    onClick={() => {
                      setJoinError('')
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
                </>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  <HourglassIcon size={14} />
                  {translate('academy.pendingApproval')}
                </span>
              ) : (
                <button
                  onClick={() => {
                    setJoinError('')
                    joinMutation.mutate()
                  }}
                  disabled={joinMutation.isPending}
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
                >
                  {joinMutation.isPending
                    ? translate('form.saving')
                    : translate('academy.requestJoin')}
                </button>
              )}
              {joinError && (
                <span className="text-xs text-rose-400">{joinError}</span>
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
                      onClick={() => leaveMutation.mutate()}
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
                      </div>
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
