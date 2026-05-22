import { useAcademyMembers } from '../hooks/useAcademyMembers'
import { useApproveMember, useRejectMember } from '../hooks/useManageMember'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import {
  CheckIcon,
  XIcon,
  LoaderIcon,
  HourglassIcon,
  UserIcon,
} from '../../../assets/icons'

type Props = {
  academyId: string
}

export function PendingRequestsPanel({ academyId }: Props) {
  const { translate } = useTranslation()
  const { data, isLoading, isError } = useAcademyMembers(academyId, { status: 'PENDING', size: 50 })
  const approve = useApproveMember(academyId)
  const reject = useRejectMember(academyId)

  const pending = data?.content ?? []

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
        {translate('academy.pending.error')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HourglassIcon size={16} className="text-amber-400" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {translate('academy.pending.title')}
        </h2>
        <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
          {pending.length}
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          {translate('academy.pending.empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {pending.map((m) => {
            const userId = m.user.id
            const isApproving = approve.isPending && approve.variables === userId
            const isRejecting = reject.isPending && reject.variables === userId
            const busy = isApproving || isRejecting
            return (
              <li
                key={userId}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <UserIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {[m.user.name, m.user.secondName].filter(Boolean).join(' ')}
                  </p>
                  {m.user.nickname && (
                    <p className="truncate text-xs text-[var(--text-subtle)]">@{m.user.nickname}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => approve.mutate(userId)}
                    disabled={busy}
                    aria-label={translate('academy.pending.approve')}
                    title={translate('academy.pending.approve')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {isApproving ? <LoaderIcon size={12} /> : <CheckIcon size={12} />}
                    {translate('academy.pending.approve')}
                  </button>
                  <button
                    onClick={() => reject.mutate(userId)}
                    disabled={busy}
                    aria-label={translate('academy.pending.reject')}
                    title={translate('academy.pending.reject')}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {isRejecting ? <LoaderIcon size={12} /> : <XIcon size={12} />}
                    {translate('academy.pending.reject')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
