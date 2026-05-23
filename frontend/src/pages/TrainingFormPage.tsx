import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useProfile } from '../features/profile/useProfile'
import { useCreateTechnique } from '../features/technique/hooks/useManageTechnique'
import { TechniquePicker } from '../features/technique/components/TechniquePicker'
import { useTraining } from '../features/training/hooks/useTrainings'
import { useCreateTraining, useUpdateTraining } from '../features/training/hooks/useManageTraining'
import type {
  TrainingRequest,
  ClassType, TrainingType, TechniqueType, TechniqueTarget,
} from '../types/api'
import {
  StarIcon,
  CheckIcon,
  XIcon,
  ChevronLeftIcon,
  LoaderIcon,
} from '../assets/icons'

// ── Constants ────────────────────────────────────────────
const CLASS_TYPES: { value: ClassType; key: string }[] = [
  { value: 'REGULAR', key: 'form.classType.REGULAR' },
  { value: 'PRIVATE', key: 'form.classType.PRIVATE' },
  { value: 'OPEN_MAT', key: 'form.classType.OPEN_MAT' },
  { value: 'SEMINAR', key: 'form.classType.SEMINAR' },
  { value: 'CAMP', key: 'form.classType.CAMP' },
  { value: 'COMPETITION', key: 'form.classType.COMPETITION' },
  { value: 'TEACHING', key: 'form.classType.TEACHING' },
]

const TRAINING_TYPES: { value: TrainingType; key: string }[] = [
  { value: 'GI', key: 'form.gi' },
  { value: 'NO_GI', key: 'form.noGi' },
]

// ── Technique creation options ───────────────────────────
const TECHNIQUE_TYPE_OPTIONS: { value: TechniqueType; label: string }[] = [
  { value: 'SUBMISSION', label: 'Submission' },
  { value: 'POSITION', label: 'Position' },
  { value: 'GUARD_POSITION', label: 'Guard Position' },
  { value: 'GUARD_PASS', label: 'Guard Pass' },
  { value: 'SWEEP', label: 'Sweep' },
  { value: 'TAKEDOWN', label: 'Takedown' },
  { value: 'PIN', label: 'Pin' },
  { value: 'SCAPE', label: 'Escape' },
  { value: 'GRIP', label: 'Grip' },
]

const TECHNIQUE_TARGET_OPTIONS: { value: TechniqueTarget; label: string }[] = [
  { value: 'HEAD', label: 'Head' },
  { value: 'NECK', label: 'Neck' },
  { value: 'SHOULDER', label: 'Shoulder' },
  { value: 'TORSO', label: 'Torso' },
  { value: 'LEG', label: 'Leg' },
  { value: 'FOOT', label: 'Foot' },
  { value: 'ANKLE', label: 'Ankle' },
  { value: 'KNEE', label: 'Knee' },
  { value: 'HIP', label: 'Hip' },
  { value: 'BACK', label: 'Back' },
  { value: 'SPINE', label: 'Spine' },
  { value: 'ARM', label: 'Arm' },
  { value: 'ELBOW', label: 'Elbow' },
  { value: 'WRIST', label: 'Wrist' },
  { value: 'HAND', label: 'Hand' },
  { value: 'GUARD_PASS', label: 'Guard Pass' },
  { value: 'GUARD_POSITION', label: 'Guard Position' },
  { value: 'PIN', label: 'Pin' },
  { value: 'TAKEDOWN', label: 'Takedown' },
  { value: 'SWEEP', label: 'Sweep' },
  { value: 'ESCAPE', label: 'Escape' },
]

// ── Star Rating Component ────────────────────────────────
function StarRating({ value, onChange, label }: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`rounded-md p-1 transition-all hover:scale-110 ${
              star <= value
                ? 'text-yellow-500'
                : 'text-[var(--text-subtle)] hover:text-yellow-500/60'
            }`}
          >
            <StarIcon filled={star <= value} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Input field wrapper ──────────────────────────────────
function Field({ label, error, children }: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      )}
    </div>
  )
}

// ── Create Technique Modal (inline in TrainingForm) ──────
function CreateTechniqueModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const { translate } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState<TechniqueType>('SUBMISSION')
  const [target, setTarget] = useState<TechniqueTarget>('ARM')
  const [error, setError] = useState<string | null>(null)

  const mutation = useCreateTechnique()
  const submit = (data: { name: string; type: TechniqueType; target: TechniqueTarget }) =>
    mutation.mutate(data, {
      onSuccess: (created) => onCreated(created.id),
      onError: (err: any) =>
        setError(err?.response?.data?.message ?? translate('technique.failedCreate')),
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">{translate('technique.newTitle')}</h3>
        <p className="mb-5 text-sm text-[var(--text-muted)]">{translate('technique.newDesc')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            submit({ name: name.trim(), type, target })
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('technique.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate('technique.namePlaceholder')}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('technique.type')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TechniqueType)}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
            >
              {TECHNIQUE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('technique.target')}</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as TechniqueTarget)}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
            >
              {TECHNIQUE_TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              {translate('technique.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending ? translate('technique.saving') : translate('technique.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Form Page ───────────────────────────────────────
export default function TrainingFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const { translate } = useTranslation()

  // ── Role check (for "+ New Technique" button) ───────────
  const { data: profile, isError: profileError } = useProfile()
  const canCreateTechnique = profile?.role === 'ADMIN' || profile?.role === 'PLATFORM_MANAGER'

  useEffect(() => {
    if (profileError) {
      navigate('/onboarding', { replace: true })
    }
  }, [profileError, navigate])

  // ── Fetch existing training for edit ────────────────────
  const { data: existing } = useTraining(id, isEdit)

  // ── Class import state (from location.state when navigating from schedule) ──
  const fromClass = (location.state as any)?.fromClass as {
    classType: string
    trainingType: string
    durationMinutes: number
    startTime: string
    techniqueIds: number[]
  } | undefined

  // ── Form state ─────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toTimeString().slice(0, 5)
  const importDate = fromClass ? new Date(fromClass.startTime).toISOString().slice(0, 10) : today
  const importTime = fromClass ? new Date(fromClass.startTime).toTimeString().slice(0, 5) : now
  const [sessionDate, setSessionDate] = useState(importDate)
  const [sessionTime, setSessionTime] = useState(importTime)
  const [trainingType, setTrainingType] = useState<TrainingType>((fromClass?.trainingType as TrainingType) ?? 'GI')
  const [classType, setClassType] = useState<ClassType>((fromClass?.classType as ClassType) ?? 'REGULAR')
  const [durationMinutes, setDurationMinutes] = useState(fromClass?.durationMinutes ?? 90)
  const [roundLengthMinutes, setRoundLengthMinutes] = useState(5)
  const [restLengthMinutes, setRestLengthMinutes] = useState(1)
  const [totalRolls, setTotalRolls] = useState(0)
  const [cardioRating, setCardioRating] = useState(3)
  const [intensityRating, setIntensityRating] = useState(3)
  const [techniqueIds, setTechniqueIds] = useState<number[]>(fromClass?.techniqueIds ?? [])
  const [submissionTechniqueIds, setSubmissionTechniqueIds] = useState<number[]>([])
  const [submissionTechniqueAllowedIds, setSubmissionTechniqueAllowedIds] = useState<number[]>([])
  const [sweeps, setSweeps] = useState(0)
  const [takedowns, setTakedowns] = useState(0)
  const [guardPasses, setGuardPasses] = useState(0)
  const [submissions, setSubmissions] = useState(0)
  const [taps, setTaps] = useState(0)
  const [escapes, setEscapes] = useState(0)
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)

  // ── Populate form on edit load ──────────────────────────
  useEffect(() => {
    if (!existing) return
    const d = new Date(existing.sessionDate)
    setSessionDate(d.toISOString().slice(0, 10))
    setSessionTime(d.toTimeString().slice(0, 5))
    setTrainingType(existing.trainingType)
    setClassType(existing.classType)
    setDurationMinutes(existing.durationMinutes)
    setRoundLengthMinutes(existing.roundLengthMinutes)
    setRestLengthMinutes(existing.restLengthMinutes)
    setTotalRolls(existing.totalRolls)
    setCardioRating(existing.cardioRating)
    setIntensityRating(existing.intensityRating)
    setTechniqueIds(existing.techniques.map((t) => t.id))
    setSubmissionTechniqueIds(existing.submissionTechniques.map((t) => t.id))
    setSubmissionTechniqueAllowedIds(existing.submissionTechniquesAllowed.map((t) => t.id))
    setSweeps(existing.sweeps)
    setTakedowns(existing.takedowns)
    setGuardPasses(existing.guardPasses)
    setSubmissions(existing.submissions)
    setTaps(existing.taps)
    setEscapes(existing.escapes)
    setDescription(existing.description ?? '')
  }, [existing])

  // ── Validation ─────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (durationMinutes < 1) e.durationMinutes = translate('form.errorDuration')
    if (roundLengthMinutes < 1) e.roundLengthMinutes = translate('form.errorRoundLength')
    if (restLengthMinutes < 0) e.restLengthMinutes = translate('form.errorRestLength')
    if (totalRolls < 0) e.totalRolls = translate('form.errorTotalRolls')
    if (cardioRating < 1 || cardioRating > 5) e.cardioRating = translate('form.errorCardioRange')
    if (intensityRating < 1 || intensityRating > 5) e.intensityRating = translate('form.errorIntensityRange')
    if (sweeps < 0) e.sweeps = translate('form.errorCannotBeNegative')
    if (takedowns < 0) e.takedowns = translate('form.errorCannotBeNegative')
    if (guardPasses < 0) e.guardPasses = translate('form.errorCannotBeNegative')
    if (submissions < 0) e.submissions = translate('form.errorCannotBeNegative')
    if (taps < 0) e.taps = translate('form.errorCannotBeNegative')
    if (escapes < 0) e.escapes = translate('form.errorCannotBeNegative')

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Mutation ────────────────────────────────────────────
  const createMutation = useCreateTraining()
  const updateMutation = useUpdateTraining(id)
  const mutation = isEdit ? updateMutation : createMutation

  const save = (data: TrainingRequest) =>
    mutation.mutate(data, {
      onSuccess: () => navigate(isEdit ? '/' : '/training'),
      onError: (err: any) =>
        setErrors({ form: err?.response?.data?.message ?? 'Failed to save training.' }),
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const localDate = new Date(`${sessionDate}T${sessionTime}`)
    const payload: TrainingRequest = {
      sessionDate: localDate.toISOString(),
      trainingType,
      classType,
      durationMinutes,
      roundLengthMinutes,
      restLengthMinutes,
      totalRolls,
      cardioRating,
      intensityRating,
      techniqueIds,
      submissionTechniqueIds,
      submissionTechniqueAllowedIds: submissionTechniqueAllowedIds,
      sweeps,
      takedowns,
      guardPasses,
      submissions,
      taps,
      escapes,
      description: description.trim() || undefined,
    }
    save(payload)
  }

  const handleCreatedTechnique = (id: number) => {
    setTechniqueIds((prev) => [...prev, id])
    setShowCreateModal(false)
  }

  return (
    <div className="mx-auto max-w-2xl pb-20">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon />
        {translate('form.back')}
      </button>

      <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">
        {isEdit ? translate('form.editTitle') : translate('form.newTitle')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Session Info ── */}
        <section className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{translate('form.sessionInfo')}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={translate('form.date')} error={errors.date}>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.time')}>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.trainingType')} error={errors.trainingType}>
              <select
                value={trainingType}
                onChange={(e) => setTrainingType(e.target.value as TrainingType)}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                {TRAINING_TYPES.map(({ value, key }) => (
                  <option key={value} value={value}>{translate(key)}</option>
                ))}
              </select>
            </Field>
            <Field label={translate('form.classType')} error={errors.classType}>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as ClassType)}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                {CLASS_TYPES.map(({ value, key }) => (
                  <option key={value} value={value}>{translate(key)}</option>
                ))}
              </select>
            </Field>
            <Field label={translate('form.duration')} error={errors.durationMinutes}>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.totalRolls')} error={errors.totalRolls}>
              <input
                type="number"
                min={0}
                value={totalRolls}
                onChange={(e) => setTotalRolls(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.roundLength')} error={errors.roundLengthMinutes}>
              <input
                type="number"
                min={1}
                value={roundLengthMinutes}
                onChange={(e) => setRoundLengthMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.restLength')} error={errors.restLengthMinutes}>
              <input
                type="number"
                min={0}
                value={restLengthMinutes}
                onChange={(e) => setRestLengthMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
          </div>
        </section>

        {/* ── Ratings ── */}
        <section className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{translate('form.ratings')}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <StarRating
              value={cardioRating}
              onChange={setCardioRating}
              label={translate('form.cardio')}
            />
            <StarRating
              value={intensityRating}
              onChange={setIntensityRating}
              label={translate('form.intensity')}
            />
          </div>
        </section>

        {/* ── Techniques ── */}
        <section className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{translate('form.techniques')}</h2>
            {canCreateTechnique && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                + {translate('form.newTechnique')}
              </button>
            )}
          </div>
          <div className="space-y-6">
            <TechniquePicker
              selectedIds={techniqueIds}
              onChange={setTechniqueIds}
              label={translate('form.techniquesPracticed')}
            />
            <TechniquePicker
              selectedIds={submissionTechniqueIds}
              onChange={setSubmissionTechniqueIds}
              label={translate('form.submissionTechniques')}
              typeFilter={['SUBMISSION']}
            />
            <TechniquePicker
              selectedIds={submissionTechniqueAllowedIds}
              onChange={setSubmissionTechniqueAllowedIds}
              label={translate('form.submissionsAllowed')}
              typeFilter={['SUBMISSION']}
            />
          </div>
        </section>

        {/* ── Combat Stats ── */}
        <section className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{translate('form.combatStats')}</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Field label={translate('form.submissions')} error={errors.submissions}>
              <input
                type="number"
                min={0}
                value={submissions}
                onChange={(e) => setSubmissions(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.taps')} error={errors.taps}>
              <input
                type="number"
                min={0}
                value={taps}
                onChange={(e) => setTaps(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.escapes')} error={errors.escapes}>
              <input
                type="number"
                min={0}
                value={escapes}
                onChange={(e) => setEscapes(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.takedowns')} error={errors.takedowns}>
              <input
                type="number"
                min={0}
                value={takedowns}
                onChange={(e) => setTakedowns(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.sweeps')} error={errors.sweeps}>
              <input
                type="number"
                min={0}
                value={sweeps}
                onChange={(e) => setSweeps(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
            <Field label={translate('form.guardPasses')} error={errors.guardPasses}>
              <input
                type="number"
                min={0}
                value={guardPasses}
                onChange={(e) => setGuardPasses(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </Field>
          </div>
        </section>

        {/* ── Notes ── */}
        <section className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{translate('form.notes')}</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={translate('form.notesPlaceholder')}
            className="w-full resize-none rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          />
        </section>

        {/* ── Error banner ── */}
        {errors.form && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-400">{errors.form}</p>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-[var(--text-primary)] py-3 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending
            ? translate('form.saving')
            : isEdit
              ? translate('form.save')
              : translate('form.saveTraining')}
        </button>
      </form>

      {/* Create technique modal */}
      {showCreateModal && (
        <CreateTechniqueModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreatedTechnique}
        />
      )}
    </div>
  )
}