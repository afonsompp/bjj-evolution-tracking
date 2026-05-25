import { useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useProfile } from '../features/profile/useProfile'
import { useAcademy } from '../features/academy/hooks/useAcademy'
import { useMembership } from '../features/academy/hooks/useMembership'
import { useAcademyMembers } from '../features/academy/hooks/useAcademyMembers'
import { useJoinAcademy, useLeaveAcademy } from '../features/academy/hooks/useJoinAcademy'
import { useAcademyPermissions } from '../features/academy/permissions/useAcademyPermissions'
import { ScheduleSection } from '../features/academy/sections/ScheduleSection'
import { MembersSection } from '../features/academy/sections/MembersSection'
import { ClassesSection } from '../features/academy/sections/ClassesSection'
import { SettingsSection } from '../features/academy/sections/SettingsSection'
import {
  BuildingIcon,
  ChevronLeftIcon,
  LoaderIcon,
  MapPinIcon,
  CheckCircleIcon,
  HourglassIcon,
  LogOutIcon,
} from '../assets/icons'

type Tab = 'schedule' | 'members' | 'classes' | 'settings'

export default function AcademyDetailPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [actionError, setActionError] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const { data: academy, isLoading: academyLoading, isError: academyError } = useAcademy(id)
  const { data: profile } = useProfile()
  const { data: membership, isLoading: membershipLoading } = useMembership(id, profile?.id)

  const isMember = membership?.status === 'ACTIVE'
  const isPending = membership?.status === 'PENDING'
  const isOwner = membership?.role === 'OWNER'

  const { canManageMembers, canManageClasses, canEditAcademy } = useAcademyPermissions(id)
  const { data: pendingMembersPage } = useAcademyMembers(id, {
    status: 'PENDING',
    size: 50,
    enabled: isMember && canManageMembers,
  })
  const pendingCount = pendingMembersPage?.totalElements ?? 0

  const availableTabs = useMemo<Tab[]>(() => {
    if (!isMember) return []
    const tabs: Tab[] = ['schedule']
    if (canManageMembers) tabs.push('members')
    if (canManageClasses) tabs.push('classes')
    if (canEditAcademy) tabs.push('settings')
    return tabs
  }, [isMember, canManageMembers, canManageClasses, canEditAcademy])

  const requestedTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab =
    requestedTab && availableTabs.includes(requestedTab) ? requestedTab : 'schedule'

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (t === 'schedule') next.delete('tab')
    else next.set('tab', t)
    setSearchParams(next, { replace: true })
  }

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

  const tabLabel = (t: Tab): string => {
    switch (t) {
      case 'schedule': return translate('academy.tab.schedule')
      case 'members': return translate('academy.tab.members')
      case 'classes': return translate('academy.tab.classes')
      case 'settings': return translate('academy.tab.settings')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 overflow-x-hidden pb-20">
      <button
        onClick={() => navigate('/academies')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.backToList')}
      </button>

      {academyLoading && (
        <div className="flex items-center justify-center py-20">
          <LoaderIcon size={24} className="text-[var(--text-muted)]" />
        </div>
      )}

      {academyError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-rose-400">{translate('academy.errorLoadDetail')}</p>
        </div>
      )}

      {academy && id && (
        <div className="space-y-6">
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {membershipLoading ? (
                <span className="text-xs text-[var(--text-subtle)]">
                  <LoaderIcon size={14} className="inline" />
                </span>
              ) : isMember ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
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

          {isMember && availableTabs.length > 1 && (
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-header)] sm:gap-2">
              {availableTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    activeTab === t
                      ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tabLabel(t)}
                  {t === 'members' && pendingCount > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 text-xs text-rose-400">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {isMember && activeTab === 'schedule' && <ScheduleSection academyId={id} />}
          {isMember && activeTab === 'members' && canManageMembers && <MembersSection academyId={id} />}
          {isMember && activeTab === 'classes' && canManageClasses && <ClassesSection academyId={id} />}
          {isMember && activeTab === 'settings' && canEditAcademy && <SettingsSection academyId={id} />}
        </div>
      )}
    </div>
  )
}
