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
import { LoaderIcon, TrashIcon, XIcon } from '../../../assets/icons'
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
  onClose: () => void
}

export function AttendanceModal({ academyId, cls, onClose }: Props) {
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

  const handleAddStudent = () => {
    if (!addStudentId) return
    registerMutation.mutate(addStudentId, {
      onSuccess: () => setAddStudentId(''),
    })
  }

  const handleCloseClass = () => {
    closeMutation.mutate(cls.id, {
      onSuccess: () => {
        setShowCloseConfirm(false)
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-lg">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-card)] p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {translate('attendance.attendance')}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {translate(`form.classType.${cls.classType}`)} ·{' '}
              {new Date(cls.startTime).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-card)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Attendees list */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex justify-center py-6">
              <LoaderIcon size={20} className="text-[var(--text-muted)]" />
            </div>
          )}

          {!isLoading && attendees.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">
              {translate('attendance.noAttendees')}
            </p>
          )}

          {!isLoading && attendees.length > 0 && (
            <div className="space-y-2">
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
                    {a.status === 'REGISTERED' && (
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
        </div>

        {/* Footer: add student + close class */}
        <div className="shrink-0 space-y-3 border-t border-[var(--border-card)] p-5">
          {/* Add student */}
          <div>
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

          {/* Close class */}
          {cls.status === 'PUBLISHED' && (
            <div>
              {!showCloseConfirm ? (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="w-full rounded-lg border border-blue-500/20 bg-blue-500/10 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/20"
                >
                  {translate('attendance.closeClass')}
                </button>
              ) : (
                <div className="space-y-2">
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
          )}
        </div>
      </div>
    </div>
  )
}
