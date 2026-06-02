import { useState } from 'react'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useTechniques } from '../features/technique/hooks/useTechniques'
import {
  useCreateTechnique,
  useUpdateTechnique,
  useDeleteTechnique,
} from '../features/technique/hooks/useManageTechnique'
import type {
  TechniqueResponse, TechniqueType, TechniqueTarget,
} from '../types/api'
import {
  PencilIcon,
  TrashIcon,
  SearchIcon,
  PlusIcon,
} from '../assets/icons'
import { apiErrorMessage } from '../lib/apiError'

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
  { value: 'HEAD', label: 'Head' }, { value: 'NECK', label: 'Neck' },
  { value: 'SHOULDER', label: 'Shoulder' }, { value: 'TORSO', label: 'Torso' },
  { value: 'LEG', label: 'Leg' }, { value: 'FOOT', label: 'Foot' },
  { value: 'ANKLE', label: 'Ankle' }, { value: 'KNEE', label: 'Knee' },
  { value: 'HIP', label: 'Hip' }, { value: 'BACK', label: 'Back' },
  { value: 'SPINE', label: 'Spine' }, { value: 'ARM', label: 'Arm' },
  { value: 'ELBOW', label: 'Elbow' }, { value: 'WRIST', label: 'Wrist' },
  { value: 'HAND', label: 'Hand' }, { value: 'GUARD_PASS', label: 'Guard Pass' },
  { value: 'GUARD_POSITION', label: 'Guard Position' }, { value: 'PIN', label: 'Pin' },
  { value: 'TAKEDOWN', label: 'Takedown' }, { value: 'SWEEP', label: 'Sweep' },
  { value: 'ESCAPE', label: 'Escape' },
]

// ── Technique Edit Modal ─────────────────────────────────
function TechniqueEditModal({
  technique, onClose,
}: {
  technique: TechniqueResponse | null
  onClose: () => void
}) {
  const { translate } = useTranslation()
  const isNew = !technique

  const [name, setName] = useState(technique?.name ?? '')
  const [type, setType] = useState<TechniqueType>(technique?.type ?? 'SUBMISSION')
  const [target, setTarget] = useState<TechniqueTarget>(technique?.target ?? 'ARM')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateTechnique()
  const update = useUpdateTechnique()
  const mutation = isNew ? create : update

  const submit = (data: { name: string; type: TechniqueType; target: TechniqueTarget }) => {
    const onSuccess = () => onClose()
    const onError = (err: unknown) =>
      setError(apiErrorMessage(err) ?? `Failed to ${isNew ? 'create' : 'update'} technique.`)
    if (isNew) create.mutate(data, { onSuccess, onError })
    else update.mutate({ id: technique!.id, body: data }, { onSuccess, onError })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
          {isNew ? translate('technique.newTitle') : translate('technique.editTitle')}
        </h3>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          {isNew
            ? translate('technique.newDesc')
            : translate('technique.editDesc', { name: technique!.name })}
        </p>

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
              {mutation.isPending
                ? translate('technique.saving')
                : isNew
                  ? translate('technique.create')
                  : translate('technique.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ─────────────────────────────────
function DeleteConfirmModal({
  technique, onConfirm, onClose, isPending,
}: {
  technique: TechniqueResponse | null
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}) {
  const { translate } = useTranslation()
  if (!technique) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{translate('technique.deleteTitle')}</h3>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          {translate('technique.deleteConfirm', { name: technique.name })}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            {translate('technique.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40"
          >
            {isPending ? translate('technique.deleting') : translate('technique.deleteBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function TechniqueManagePage() {
  const { translate } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [editTarget, setEditTarget] = useState<TechniqueResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TechniqueResponse | null>(null)
  const [showNew, setShowNew] = useState(false)

  const SIZE = 20

  const { data, isLoading, isError } = useTechniques(search, page, SIZE)
  const deleteMutation = useDeleteTechnique()

  const totalPages = data?.totalPages ?? 0
  const techniques = data?.content ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border-header)] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {translate('technique.title')}
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">
            {data
              ? translate('technique.count', { count: data.totalElements })
              : translate('technique.loading')}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
        >
          <PlusIcon />
          {translate('technique.new')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={translate('technique.searchPlaceholder')}
          className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <div className="h-5 w-48 rounded bg-[var(--bg-subtle)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-rose-400">{translate('technique.errorLoad')}</p>
        </div>
      )}

      {/* Technique list */}
      {!isLoading && techniques.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--border-card)] p-16 text-center">
          <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
            {search ? translate('technique.emptySearch') : translate('technique.emptyTitle')}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {search ? translate('technique.emptySearchHint') : translate('technique.emptyHint')}
          </p>
        </div>
      )}

      {!isLoading && techniques.length > 0 && (
        <div className="space-y-3">
          {techniques.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-4 shadow-sm transition-colors hover:border-[var(--border-card-hover)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                <div className="mt-1 flex gap-2 text-xs text-[var(--text-subtle)]">
                  <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5">{t.type}</span>
                  <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5">{t.target}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditTarget(t)}
                  className="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  title={translate('technique.edit')}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="rounded-lg p-2 text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] hover:text-rose-500"
                  title={translate('technique.delete')}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {translate('technique.previous')}
          </button>
          <span className="text-sm text-[var(--text-subtle)]">
            {translate('technique.pageOf', { page: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {translate('technique.next')}
          </button>
        </div>
      )}

      {/* Modals */}
      {(showNew || editTarget) && (
        <TechniqueEditModal
          technique={showNew ? null : editTarget}
          onClose={() => { setShowNew(false); setEditTarget(null) }}
        />
      )}
      <DeleteConfirmModal
        technique={deleteTarget}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onClose={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}