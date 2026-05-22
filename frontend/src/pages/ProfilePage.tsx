import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import type { ProfileRequest, Belt } from '../types/api'
import { useProfile, useUpsertProfile } from '../features/profile/useProfile'

const BELTS: { group: string; values: { label: string; value: Belt }[] }[] = [
  {
    group: 'Adulto',
    values: [
      { label: 'White', value: 'WHITE' },
      { label: 'Blue', value: 'BLUE' },
      { label: 'Purple', value: 'PURPLE' },
      { label: 'Brown', value: 'BROWN' },
      { label: 'Black', value: 'BLACK' },
    ],
  },
  {
    group: 'Infanto-Juvenil',
    values: [
      { label: 'Gray/White', value: 'GRAY_WHITE' },
      { label: 'Gray', value: 'GRAY' },
      { label: 'Gray/Black', value: 'GRAY_BLACK' },
      { label: 'Yellow/White', value: 'YELLOW_WHITE' },
      { label: 'Yellow', value: 'YELLOW' },
      { label: 'Yellow/Black', value: 'YELLOW_BLACK' },
      { label: 'Orange/White', value: 'ORANGE_WHITE' },
      { label: 'Orange', value: 'ORANGE' },
      { label: 'Orange/Black', value: 'ORANGE_BLACK' },
      { label: 'Green/White', value: 'GREEN_WHITE' },
      { label: 'Green', value: 'GREEN' },
      { label: 'Green/Black', value: 'GREEN_BLACK' },
    ],
  },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  secondName: z.string().optional(),
  nickname: z.string().min(1, 'Nickname is required'),
  belt: z.string().optional(),
  beltStripe: z.string().optional(),
  startsIn: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function toRequest(data: FormValues): ProfileRequest {
  return {
    name: data.name,
    secondName: data.secondName || undefined,
    nickname: data.nickname,
    belt: (data.belt || undefined) as Belt | undefined,
    beltStripe: data.beltStripe ? parseInt(data.beltStripe, 10) : undefined,
    startsIn: data.startsIn || undefined,
  }
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { translate } = useTranslation()

  const { data: profile, isLoading, isError: profileError } = useProfile()

  useEffect(() => {
    if (profileError) {
      navigate('/onboarding', { replace: true })
    }
  }, [profileError, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          name: profile.name,
          secondName: profile.secondName ?? '',
          nickname: profile.nickname,
          belt: profile.belt ?? '',
          beltStripe: profile.beltStripe?.toString() ?? '',
          startsIn: profile.startsIn ?? '',
        }
      : undefined,
  })

  const mutation = useUpsertProfile()
  const submit = (data: FormValues) => mutation.mutate(toRequest(data))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg animate-pulse space-y-6 pt-8">
        <div className="h-8 w-36 rounded bg-[var(--bg-subtle)]" />
        <div className="h-[400px] rounded-xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg pb-20">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {translate('profile.title')}
      </h1>

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        {/* Name fields */}
        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.name')}</label>
              <input
                {...register('name')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.secondName')}</label>
              <input
                {...register('secondName')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.nickname')}</label>
            <input
              {...register('nickname')}
              className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]"
            />
            {errors.nickname && <p className="mt-1 text-xs text-rose-500">{errors.nickname.message}</p>}
          </div>
        </div>

        {/* BJJ details */}
        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.belt')}</label>
              <select
                {...register('belt')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                <option value="">—</option>
                {BELTS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.values.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.beltStripe')}</label>
              <input
                type="number"
                min={0}
                max={4}
                {...register('beltStripe')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.started')}</label>
              <input
                type="date"
                {...register('startsIn')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {mutation.isError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className="text-sm text-rose-400">
              {(mutation.error as any)?.response?.data?.message ?? translate('profile.failed')}
            </p>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-400">{translate('profile.saved')}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-[var(--text-primary)] px-6 py-2.5 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? translate('profile.saving') : translate('profile.save')}
        </button>
      </form>
    </div>
  )
}
