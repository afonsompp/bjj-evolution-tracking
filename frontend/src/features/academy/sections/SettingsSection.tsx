import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { useAcademy } from '../hooks/useAcademy'
import { useUpdateAcademy } from '../hooks/useUpdateAcademy'
import { LoaderIcon } from '../../../assets/icons'

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type Props = { academyId: string }

export function SettingsSection({ academyId }: Props) {
  const { translate } = useTranslation()
  const { data: academy, isLoading } = useAcademy(academyId)
  const update = useUpdateAcademy(academyId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '' },
  })

  useEffect(() => {
    if (academy) reset({ name: academy.name, address: academy.address ?? '' })
  }, [academy, reset])

  const onSubmit = (values: FormValues) => {
    update.mutate(values)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon size={24} className="text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-sm"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-muted)]">
          {translate('academy.settings.name')}
        </label>
        <input
          type="text"
          {...register('name')}
          className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
        />
        {errors.name && (
          <p className="text-xs text-rose-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-muted)]">
          {translate('academy.settings.address')}
        </label>
        <input
          type="text"
          {...register('address')}
          className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
        />
        {errors.address && (
          <p className="text-xs text-rose-400">{errors.address.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={update.isPending || !isDirty}
          className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
        >
          {update.isPending ? translate('form.saving') : translate('academy.settings.save')}
        </button>
        {update.isSuccess && (
          <span className="text-xs text-emerald-400">{translate('academy.settings.saved')}</span>
        )}
        {update.isError && (
          <span className="text-xs text-rose-400">{translate('academy.settings.error')}</span>
        )}
      </div>
    </form>
  )
}
