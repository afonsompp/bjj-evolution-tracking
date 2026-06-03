import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useAcademyMembers } from '../features/academy/hooks/useAcademyMembers'
import { useCreateClass, useUpdateClass } from '../features/academy/hooks/useClassMutations'
import { useClass } from '../features/academy/hooks/useClasses'
import { useProfile } from '../features/profile/useProfile'
import { TechniquePicker } from '../features/technique/components/TechniquePicker'
import { CreateTechniqueModal } from '../features/technique/components/CreateTechniqueModal'
import { ChevronLeftIcon, LoaderIcon } from '../assets/icons'
import { handleIntInput } from '../lib/numericInput'
import type { ClassType, ClassStatus, TrainingType } from '../types/api'

const CLASS_TYPES: ClassType[] = ['REGULAR', 'PRIVATE', 'OPEN_MAT', 'SEMINAR', 'CAMP', 'COMPETITION', 'TEACHING']
const TRAINING_TYPES: TrainingType[] = ['GI', 'NO_GI']
const INSTRUCTOR_ROLES = ['OWNER', 'MANAGER', 'INSTRUCTOR']

export default function ClassFormPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id: academyId, classId } = useParams<{ id: string; classId: string }>()
  const isEdit = !!classId

  const { data: membersPage } = useAcademyMembers(academyId, {
    status: 'ACTIVE',
    size: 100,
  })
  const instructors = (membersPage?.content ?? []).filter((m) =>
    INSTRUCTOR_ROLES.includes(m.role),
  )

  const { data: existingClass } = useClass(isEdit ? academyId : undefined, classId)

  const createMutation = useCreateClass(academyId!)
  const updateMutation = useUpdateClass(academyId!)

  const [instructorId, setInstructorId] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(60)
  const [classType, setClassType] = useState<ClassType>('REGULAR')
  const [trainingType, setTrainingType] = useState<TrainingType>('GI')
  const [status, setStatus] = useState<ClassStatus>('PUBLISHED')
  const [techniqueIds, setTechniqueIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [showCreateTechnique, setShowCreateTechnique] = useState(false)

  const { data: profile } = useProfile()
  const canCreateTechnique = profile?.role === 'ADMIN' || profile?.role === 'PLATFORM_MANAGER'

  const handleCreatedTechnique = (id: number) => {
    setTechniqueIds((prev) => [...prev, id])
    setShowCreateTechnique(false)
  }

  // Hydrate the form when the fetched class first arrives (or changes identity
  // on refetch). Done while rendering, keyed on the source object, instead of in
  // an effect — the React-endorsed "adjust state during render" pattern.
  const [hydratedFrom, setHydratedFrom] = useState<typeof existingClass>(undefined)
  if (existingClass && existingClass !== hydratedFrom) {
    setHydratedFrom(existingClass)
    setInstructorId(existingClass.instructor.id)
    const dt = new Date(existingClass.startTime)
    setStartDateTime(dt.toISOString().slice(0, 16))
    setDurationMinutes(existingClass.durationMinutes)
    setClassType(existingClass.classType)
    setTrainingType(existingClass.trainingType)
    setStatus(existingClass.status)
    setTechniqueIds(existingClass.scheduledTechniques.map((t) => t.id))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const body = {
      academyId: academyId!,
      instructorId,
      startTime: new Date(startDateTime).toISOString(),
      // The required number input guarantees a value before submit.
      durationMinutes: durationMinutes ?? 0,
      classType,
      trainingType,
      status,
      techniqueIds,
    }

    if (isEdit) {
      updateMutation.mutate(
        { classId: Number(classId), body },
        {
          onSuccess: () => navigate(`/academies/${academyId}/classes`),
          onError: () => setError(translate('class.saveError')),
        },
      )
    } else {
      createMutation.mutate(body, {
        onSuccess: () => navigate(`/academies/${academyId}/classes`),
        onError: () => setError(translate('class.saveError')),
      })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      <button
        onClick={() => navigate(`/academies/${academyId}/classes`)}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.manageClasses')}
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {isEdit ? translate('class.edit') : translate('class.new')}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
      >
        {/* Instructor */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('form.instructor')}
          </label>
          <select
            required
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
          >
            <option value="">—</option>
            {instructors.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name} {m.user.secondName ?? ''} ({m.role})
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('form.startDateTime')}
          </label>
          <input
            type="datetime-local"
            required
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('form.durationMinutes')}
          </label>
          <input
            type="number"
            required
            min={15}
            max={480}
            value={durationMinutes ?? ''}
            onChange={(e) => handleIntInput(e, setDurationMinutes)}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
          />
        </div>

        {/* Class Type + Training Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              {translate('form.classType')}
            </label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value as ClassType)}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
            >
              {CLASS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {translate(`form.classType.${t}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              {translate('form.trainingType')}
            </label>
            <select
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value as TrainingType)}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
            >
              {TRAINING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {translate(`trainingType.${t}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Techniques */}
        <div className="space-y-2">
          {canCreateTechnique && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCreateTechnique(true)}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-page)] hover:opacity-90"
              >
                + {translate('form.newTechnique')}
              </button>
            </div>
          )}
          <TechniquePicker
            selectedIds={techniqueIds}
            onChange={setTechniqueIds}
            label={translate('form.techniquesPracticed')}
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClassStatus)}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
          >
            <option value="DRAFT">{translate('class.status.DRAFT')}</option>
            <option value="PUBLISHED">{translate('class.status.PUBLISHED')}</option>
          </select>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/academies/${academyId}/classes`)}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {translate('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <LoaderIcon size={14} className="inline animate-spin" />
            ) : (
              translate('form.save')
            )}
          </button>
        </div>
      </form>

      {showCreateTechnique && (
        <CreateTechniqueModal
          onClose={() => setShowCreateTechnique(false)}
          onCreated={handleCreatedTechnique}
        />
      )}
    </div>
  )
}
