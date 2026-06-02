import { useState } from 'react'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { useCreateTechnique } from '../hooks/useManageTechnique'
import { apiErrorMessage } from '../../../lib/apiError'
import {
  TECHNIQUE_TYPES, TECHNIQUE_TARGETS, techniqueTypeKey, techniqueTargetKey,
} from '../../../lib/i18n/technique'
import type { TechniqueType, TechniqueTarget } from '../../../types/api'

/**
 * Inline "create a technique" dialog, shared by the training, class and class
 * template forms so a technique missing from the catalog can be added without
 * leaving the form. Calls back with the new technique's id on success.
 */
export function CreateTechniqueModal({
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
      onError: (err: unknown) =>
        setError(apiErrorMessage(err) ?? translate('technique.failedCreate')),
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
              {TECHNIQUE_TYPES.map((value) => (
                <option key={value} value={value}>{translate(techniqueTypeKey(value))}</option>
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
              {TECHNIQUE_TARGETS.map((value) => (
                <option key={value} value={value}>{translate(techniqueTargetKey(value))}</option>
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
