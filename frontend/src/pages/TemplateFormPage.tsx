import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useAcademyMembers } from '../features/academy/hooks/useAcademyMembers'
import { useTemplate } from '../features/academy/hooks/useTemplates'
import {
  useCreateTemplate,
  useUpdateTemplate,
} from '../features/academy/hooks/useTemplateMutations'
import { useProfile } from '../features/profile/useProfile'
import { TechniquePicker } from '../features/technique/components/TechniquePicker'
import { CreateTechniqueModal } from '../features/technique/components/CreateTechniqueModal'
import { ChevronLeftIcon, LoaderIcon, PlusIcon, TrashIcon } from '../assets/icons'
import type { ClassType, ClassRecurrenceRule, DayOfWeek, TrainingType } from '../types/api'

const CLASS_TYPES: ClassType[] = ['REGULAR', 'PRIVATE', 'OPEN_MAT', 'SEMINAR', 'CAMP', 'COMPETITION', 'TEACHING']
const TRAINING_TYPES: TrainingType[] = ['GI', 'NO_GI']
const DAYS_OF_WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const INSTRUCTOR_ROLES = ['OWNER', 'MANAGER', 'INSTRUCTOR']

export default function TemplateFormPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const { id: academyId, templateId } = useParams<{ id: string; templateId: string }>()
  const isEdit = !!templateId

  const { data: membersPage } = useAcademyMembers(academyId, { status: 'ACTIVE', size: 100 })
  const instructors = (membersPage?.content ?? []).filter((m) =>
    INSTRUCTOR_ROLES.includes(m.role),
  )

  const { data: existing } = useTemplate(isEdit ? academyId : undefined, templateId)

  const createMutation = useCreateTemplate(academyId!)
  const updateMutation = useUpdateTemplate(academyId!)

  const [name, setName] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [classType, setClassType] = useState<ClassType>('REGULAR')
  const [trainingType, setTrainingType] = useState<TrainingType>('GI')
  const [rules, setRules] = useState<ClassRecurrenceRule[]>([
    { dayOfWeek: 'MONDAY', startTime: '19:00:00' },
  ])
  const [techniqueIds, setTechniqueIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [showCreateTechnique, setShowCreateTechnique] = useState(false)

  const { data: profile } = useProfile()
  const canCreateTechnique = profile?.role === 'ADMIN' || profile?.role === 'PLATFORM_MANAGER'

  const handleCreatedTechnique = (id: number) => {
    setTechniqueIds((prev) => [...prev, id])
    setShowCreateTechnique(false)
  }

  // Hydrate the form when the fetched template first arrives (or changes
  // identity on refetch). Done while rendering, keyed on the source object,
  // instead of in an effect — the React-endorsed "adjust state during render"
  // pattern.
  const [hydratedFrom, setHydratedFrom] = useState<typeof existing>(undefined)
  if (existing && existing !== hydratedFrom) {
    setHydratedFrom(existing)
    setName(existing.name)
    setInstructorId(existing.instructor.id)
    setDurationMinutes(existing.durationMinutes)
    setClassType(existing.classType)
    setTrainingType(existing.trainingType)
    if (existing.recurrenceRules.length > 0) setRules(existing.recurrenceRules)
    setTechniqueIds(existing.techniques.map((t) => t.id))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const addRule = () =>
    setRules((prev) => [...prev, { dayOfWeek: 'MONDAY', startTime: '19:00:00' }])

  const removeRule = (i: number) =>
    setRules((prev) => prev.filter((_, idx) => idx !== i))

  const updateRule = (i: number, field: keyof ClassRecurrenceRule, value: string) =>
    setRules((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, [field]: field === 'startTime' ? `${value}:00` : value } : r,
      ),
    )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const body = {
      name,
      instructorId,
      durationMinutes,
      classType,
      trainingType,
      techniqueIds,
      recurrenceRules: rules,
    }

    if (isEdit) {
      updateMutation.mutate(
        { templateId: templateId!, body },
        {
          onSuccess: () => navigate(`/academies/${academyId}/classes?tab=templates`),
          onError: () => setError(translate('template.saveError')),
        },
      )
    } else {
      createMutation.mutate(body, {
        onSuccess: () => navigate(`/academies/${academyId}/classes?tab=templates`),
        onError: () => setError(translate('template.saveError')),
      })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      <button
        onClick={() => navigate(`/academies/${academyId}/classes?tab=templates`)}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.manageClasses')}
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {isEdit ? translate('template.edit') : translate('template.new')}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('academy.infoName')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monday/Wednesday Regular Class"
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          />
        </div>

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
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
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
            label={translate('template.techniques')}
          />
        </div>

        {/* Recurrence Rules */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {translate('template.recurrence')}
          </p>
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={rule.dayOfWeek}
                onChange={(e) => updateRule(i, 'dayOfWeek', e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {translate(`dayOfWeek.${d}`)}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={rule.startTime.slice(0, 5)}
                onChange={(e) => updateRule(i, 'startTime', e.target.value)}
                className="rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
              {rules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                >
                  <TrashIcon size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRule}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <PlusIcon size={12} />
            {translate('template.addRule')}
          </button>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/academies/${academyId}/classes?tab=templates`)}
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
