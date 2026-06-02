import { useState } from 'react'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { ALL_BELTS, beltKey } from '../../../lib/i18n/belts'
import { useAuth } from '../../auth/AuthContext'
import { useAcademyMembers } from '../hooks/useAcademyMembers'
import { useAcademyPermissions } from '../permissions/useAcademyPermissions'
import { PendingRequestsPanel } from '../components/PendingRequestsPanel'
import { GraduationHistorySection } from './GraduationHistorySection'
import { AttendanceHistorySection } from './AttendanceHistorySection'
import { Avatar } from '../../../components/Avatar'
import {
  useRejectMember,
  useGraduateMember,
  useChangeRole,
} from '../hooks/useManageMember'
import type { AcademyMemberResponse, Belt, MemberRole } from '../../../types/api'
import {
  SearchIcon,
  TrashIcon,
  TrophyIcon,
  ShieldIcon,
  UsersIcon,
  LoaderIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '../../../assets/icons'

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'MANAGER', label: 'Manager' },
]

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

function roleBadgeClass(role: MemberRole): string {
  switch (role) {
    case 'OWNER': return 'bg-amber-500/20 text-amber-400'
    case 'MANAGER': return 'bg-blue-500/20 text-blue-400'
    case 'INSTRUCTOR': return 'bg-purple-500/20 text-purple-400'
    default: return 'bg-zinc-500/20 text-zinc-400'
  }
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl">
        {children}
      </div>
    </div>
  )
}

type Props = { academyId: string }

export function MembersSection({ academyId }: Props) {
  const { translate } = useTranslation()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<'remove' | 'graduate' | 'changeRole' | null>(null)
  const [selected, setSelected] = useState<AcademyMemberResponse | null>(null)
  const [graduateBelt, setGraduateBelt] = useState<Belt>('WHITE')
  const [graduateStripe, setGraduateStripe] = useState(0)
  const [newRole, setNewRole] = useState<MemberRole>('STUDENT')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'attendances' | 'graduations'>('attendances')

  const { data, isLoading, isError } = useAcademyMembers(academyId, {
    query: search || undefined,
    status: 'ACTIVE',
    page,
    size: 20,
  })

  const { data: pendingData } = useAcademyMembers(academyId, { status: 'PENDING', size: 50 })
  const hasPending = (pendingData?.totalElements ?? 0) > 0

  const { canManageMembers, canEditAcademy } = useAcademyPermissions(academyId)

  const removeMutation = useRejectMember(academyId)
  const graduateMutation = useGraduateMember(academyId)
  const changeRoleMutation = useChangeRole(academyId)

  const closeModal = () => {
    setModal(null)
    setSelected(null)
  }

  const openRemove = (member: AcademyMemberResponse) => {
    setSelected(member)
    setModal('remove')
  }

  const openGraduate = (member: AcademyMemberResponse) => {
    setSelected(member)
    setGraduateBelt(member.belt ?? 'WHITE')
    setGraduateStripe(member.beltStripe ?? 0)
    setModal('graduate')
  }

  const openChangeRole = (member: AcademyMemberResponse) => {
    setSelected(member)
    setNewRole(member.role === 'OWNER' ? 'MANAGER' : member.role)
    setModal('changeRole')
  }

  const toggleDetail = (member: AcademyMemberResponse) => {
    setExpandedId((cur) => {
      if (cur === member.user.id) return null
      setDetailTab('attendances')
      return member.user.id
    })
  }

  const handleRemove = () => {
    if (!selected) return
    removeMutation.mutate(selected.user.id, { onSuccess: closeModal })
  }

  const handleGraduate = () => {
    if (!selected) return
    graduateMutation.mutate(
      { userId: selected.user.id, body: { newBelt: graduateBelt, newStripe: graduateStripe } },
      { onSuccess: closeModal },
    )
  }

  const handleChangeRole = () => {
    if (!selected) return
    changeRoleMutation.mutate(
      {
        userId: selected.user.id,
        body: {
          userId: selected.user.id,
          role: newRole,
          status: selected.status,
          belt: selected.belt,
          beltStripe: selected.beltStripe,
        },
      },
      { onSuccess: closeModal },
    )
  }

  const members = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const selectClass =
    'w-full rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-zinc-500'
  const btnPrimary =
    'rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50'
  const btnSecondary =
    'rounded-lg border border-[var(--border-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]'

  return (
    <div className="space-y-6">
      {hasPending && <PendingRequestsPanel academyId={academyId} />}

      {data && (
        <p className="text-sm text-[var(--text-muted)]">
          {translate('members.count').replace('{count}', String(data.totalElements))}
        </p>
      )}

      <div className="relative">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          type="text"
          placeholder={translate('members.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="w-full rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {translate('members.error')}
        </div>
      )}

      {!isLoading && !isError && members.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-10 text-center">
          <UsersIcon size={32} className="mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="font-medium text-[var(--text-primary)]">{translate('members.emptyTitle')}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{translate('members.emptyDesc')}</p>
        </div>
      )}

      {!isLoading && members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => {
            const isSelf = member.user.id === user?.id
            const isOwner = member.role === 'OWNER'

            const isExpanded = expandedId === member.user.id

            return (
              <div
                key={member.user.id}
                className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]"
              >
                <div
                  onClick={() => toggleDetail(member)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[var(--bg-subtle)]"
                >
                  <Avatar photoUrl={member.user.photoUrl} name={member.user.name} size={36} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {member.user.name}
                      {member.user.secondName ? ` ${member.user.secondName}` : ''}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      @{member.user.nickname}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${beltBadgeClass(member.belt)}`}>
                      {member.belt ? translate(beltKey(member.belt)) : '—'}
                      {member.beltStripe != null && member.beltStripe > 0
                        ? ` · ${member.beltStripe}`
                        : ''}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {canManageMembers && (
                      <button
                        title={translate('members.graduate')}
                        disabled={isOwner}
                        onClick={() => openGraduate(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-amber-400 disabled:opacity-30 disabled:hover:text-[var(--text-muted)]"
                      >
                        <TrophyIcon size={15} />
                      </button>
                    )}
                    {canEditAcademy && !isOwner && (
                      <button
                        title={translate('members.changeRole')}
                        onClick={() => openChangeRole(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-blue-400"
                      >
                        <ShieldIcon size={15} />
                      </button>
                    )}
                    {canManageMembers && (
                      <button
                        title={translate('members.remove')}
                        disabled={isSelf || isOwner}
                        onClick={() => openRemove(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-rose-400 disabled:opacity-30 disabled:hover:text-[var(--text-muted)]"
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>

                  <span className="shrink-0 text-[var(--text-subtle)]">
                    {isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                  </span>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--border-card)]">
                    <div className="flex gap-1 border-b border-[var(--border-card)] px-4">
                      {(['attendances', 'graduations'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDetailTab(t)}
                          className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                            detailTab === t
                              ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {t === 'attendances' ? <CalendarIcon size={14} /> : <TrophyIcon size={14} />}
                          {translate(`academy.tab.${t}`)}
                        </button>
                      ))}
                    </div>
                    <div className="p-4">
                      {detailTab === 'attendances' && (
                        <AttendanceHistorySection variant="member" academyId={academyId} userId={member.user.id} />
                      )}
                      {detailTab === 'graduations' && (
                        <GraduationHistorySection variant="mine" academyId={academyId} userId={member.user.id} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            {translate('academy.previous')}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {translate('academy.pageOf')
              .replace('{page}', String(page + 1))
              .replace('{total}', String(totalPages))}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            {translate('academy.next')}
          </button>
        </div>
      )}

      {modal === 'remove' && selected && (
        <Modal>
          <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
            {translate('members.confirmRemoveTitle')}
          </h3>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            {translate('members.confirmRemoveDesc').replace('{name}', selected.user.name)}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className={btnSecondary}>
              {translate('members.cancel')}
            </button>
            <button
              disabled={removeMutation.isPending}
              onClick={handleRemove}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {removeMutation.isPending ? (
                <LoaderIcon size={14} className="inline animate-spin" />
              ) : (
                translate('members.remove')
              )}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'graduate' && selected && (
        <Modal>
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            {translate('members.graduateTitle')}
          </h3>
          <p className="mb-4 text-sm text-[var(--text-muted)]">{selected.user.name}</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                {translate('members.newBelt')}
              </label>
              <select
                value={graduateBelt}
                onChange={(e) => setGraduateBelt(e.target.value as Belt)}
                className={selectClass}
              >
                {ALL_BELTS.map((b) => (
                  <option key={b} value={b}>{translate(beltKey(b))}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                {translate('members.newStripe')}
              </label>
              <select
                value={graduateStripe}
                onChange={(e) => setGraduateStripe(Number(e.target.value))}
                className={selectClass}
              >
                {[0, 1, 2, 3, 4].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={closeModal} className={btnSecondary}>
              {translate('members.cancel')}
            </button>
            <button
              disabled={graduateMutation.isPending}
              onClick={handleGraduate}
              className={btnPrimary}
            >
              {graduateMutation.isPending ? (
                <LoaderIcon size={14} className="inline animate-spin" />
              ) : (
                translate('members.confirm')
              )}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'changeRole' && selected && (
        <Modal>
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            {translate('members.changeRoleTitle')}
          </h3>
          <p className="mb-4 text-sm text-[var(--text-muted)]">{selected.user.name}</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {translate('members.selectRole')}
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as MemberRole)}
              className={selectClass}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={closeModal} className={btnSecondary}>
              {translate('members.cancel')}
            </button>
            <button
              disabled={changeRoleMutation.isPending}
              onClick={handleChangeRole}
              className={btnPrimary}
            >
              {changeRoleMutation.isPending ? (
                <LoaderIcon size={14} className="inline animate-spin" />
              ) : (
                translate('members.confirm')
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
