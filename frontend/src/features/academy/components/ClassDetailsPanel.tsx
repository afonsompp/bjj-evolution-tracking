import { useState } from 'react'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { useClassAttendance } from '../hooks/useAttendance'
import {
  useConfirmAttendance,
  useRemoveAttendance,
  useRegisterAttendance,
  useCloseClass,
} from '../hooks/useAttendanceMutations'
import { useAcademyMembers } from '../hooks/useAcademyMembers'
import { LoaderIcon, PencilIcon, TrashIcon, XIcon } from '../../../assets/icons'
import { Avatar } from '../../../components/Avatar'
import type { ScheduledClassResponse } from '../../../types/api'

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/10 text-emerald-400',
  REGISTERED: 'bg-amber-500/10 text-amber-400',
  CANCELED: 'bg-zinc-500/10 text-zinc-400',
}

interface Props {
  academyId: string
  cls: ScheduledClassResponse
  onEdit: () => void
  onRequestCancel: () => void
}

export function ClassDetailsPanel({ academyId, cls, onEdit, onRequestCancel }: Props) {
  const { translate } = useTranslation()
  const [addStudentId, setAddStudentId] = useState('')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const { data: attendancePage, isLoading } = useClassAttendance(academyId, cls.id)
  const { data: membersPage } = useAcademyMembers(academyId, { status: 'ACTIVE', size: 100 })

  const confirmMutation = useConfirmAttendance(academyId, cls.id)
  const removeMutation = useRemoveAttendance(academyId, cls.id)
  const registerMutation = useRegisterAttendance(academyId, cls.id)
  const closeMutation = useCloseClass(academyId)

  const attendees = attendancePage?.content ?? []
  const registeredIds = new Set(attendees.map((a) => a.student.id))
  const eligibleMembers = (membersPage?.content ?? []).filter(
    (m) => !registeredIds.has(m.user.id) && m.user.id !== cls.instructor.id,
  )

  const canEdit = cls.status === 'DRAFT' || cls.status === 'PUBLISHED'
  const canCancel = cls.status !== 'COMPLETED' && cls.status !== 'CANCELED'

  const handleAddStudent = () => {
    if (!addStudentId) return
    registerMutation.mutate(addStudentId, {
      onSuccess: () => setAddStudentId(''),
    })
  }

  const handleCloseClass = () => {
    closeMutation.mutate(cls.id, {
      onSuccess: () => setShowCloseConfirm(false),
    })
  }

  return (
    <div className="space-y-4 p-4">
      {/* Details */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">
          {translate('class.details')}
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-[var(--text-muted)]">{translate('form.instructor')}</dt>
          <dd className="text-[var(--text-primary)]">{cls.instructor.name}</dd>
          <dt className="text-[var(--text-muted)]">{translate('history.techniques')}</dt>
          <dd className="text-[var(--text-primary)]">
            {cls.scheduledTechniques.length > 0
              ? cls.scheduledTechniques.map((t) => t.name).join(', ')
              : translate('class.noTechniques')}
          </dd>
        </dl>
      </div>

      {/* Attendance */}
      <div className="space-y-2 border-t border-[var(--border-card)] pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">
          {translate('attendance.attendance')}
        </p>

        {isLoading && (
          <div className="flex justify-center py-4">
            <LoaderIcon size={20} className="text-[var(--text-muted)]" />
          </div>
        )}

        {!isLoading && attendees.length === 0 && (
          <p className="py-2 text-sm text-[var(--text-muted)]">
            {translate('attendance.noAttendees')}
          </p>
        )}

        {!isLoading && attendees.length > 0 && (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {attendees.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-2"
              >
                <Avatar photoUrl={a.student.photoUrl} name={a.student.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {a.student.name}
                    {a.student.secondName ? ` ${a.student.secondName}` : ''}
                  </p>
                  {a.checkInTime && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(a.checkInTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[a.status] ?? ''}`}
                >
                  {translate(`attendance.status.${a.status}`)}
                </span>
                <div className="flex gap-1">
                  {a.status === 'REGISTERED' && cls.status !== 'CANCELED' && (
                    <button
                      onClick={() => confirmMutation.mutate(a.student.id)}
                      disabled={confirmMutation.isPending}
                      className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {translate('attendance.confirm')}
                    </button>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(a.student.id)}
                    disabled={removeMutation.isPending}
                    className="rounded border border-rose-500/20 bg-rose-500/10 p-1 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add student — published classes (live) or completed ones (retroactive fix); matches backend rule */}
        {cls.status === 'PUBLISHED' || cls.status === 'COMPLETED' ? (
          <div className="pt-1">
            <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">
              {translate('attendance.addStudent')}
            </p>
            <div className="flex gap-2">
              <select
                value={addStudentId}
                onChange={(e) => setAddStudentId(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                <option value="">—</option>
                {eligibleMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} {m.user.secondName ?? ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddStudent}
                disabled={!addStudentId || registerMutation.isPending}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
              >
                {registerMutation.isPending ? (
                  <LoaderIcon size={14} className="inline animate-spin" />
                ) : (
                  translate('attendance.add')
                )}
              </button>
            </div>
          </div>
        ) : cls.status === 'DRAFT' ? (
          <p className="text-xs text-[var(--text-muted)]">
            {translate('attendance.draftNotice')}
          </p>
        ) : null}
      </div>

      {/* Actions */}
      {(canEdit || canCancel || cls.status === 'PUBLISHED') && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border-card)] pt-4">
          {canEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <PencilIcon size={13} />
              {translate('class.edit')}
            </button>
          )}
          {cls.status === 'PUBLISHED' && !showCloseConfirm && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
            >
              {translate('attendance.closeClass')}
            </button>
          )}
          {canCancel && (
            <button
              onClick={onRequestCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20"
            >
              <XIcon size={13} />
              {translate('class.cancel')}
            </button>
          )}
        </div>
      )}

      {/* Close class confirmation */}
      {showCloseConfirm && (
        <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="text-xs text-[var(--text-muted)]">
            {translate('attendance.closeClassConfirm')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCloseConfirm(false)}
              className="flex-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {translate('form.cancel')}
            </button>
            <button
              onClick={handleCloseClass}
              disabled={closeMutation.isPending}
              className="flex-1 rounded-lg bg-blue-500 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {closeMutation.isPending ? (
                <LoaderIcon size={12} className="inline animate-spin" />
              ) : (
                translate('attendance.closeClass')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
