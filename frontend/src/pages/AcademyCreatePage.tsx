import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { useCreateAcademy } from '../features/academy/hooks/useCreateAcademy'
import { ChevronLeftIcon } from '../assets/icons'

export default function AcademyCreatePage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const mutation = useCreateAcademy()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate(
      { name, address },
      {
        onSuccess: (academy) => navigate(`/academies/${academy.id}`),
        onError: () => setError(translate('academy.createError')),
      },
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      <button
        onClick={() => navigate('/academies')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeftIcon size={14} />
        {translate('academy.backToList')}
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {translate('academy.createTitle')}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {translate('academy.createSubtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('academy.infoName')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={translate('academy.namePlaceholder')}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {translate('academy.infoAddress')}
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={translate('academy.addressPlaceholder')}
            className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/academies')}
            className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-page)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {translate('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? translate('form.saving') : translate('academy.createButton')}
          </button>
        </div>
      </form>
    </div>
  )
}
