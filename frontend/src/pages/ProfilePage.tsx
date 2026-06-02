import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../lib/i18n/I18nContext'
import { BELT_GROUPS, beltKey } from '../lib/i18n/belts'
import type { ProfileRequest, Belt } from '../types/api'
import { apiErrorMessage } from '../lib/apiError'
import { useProfile, useUpsertProfile, useUploadPhoto, useRemovePhoto } from '../features/profile/useProfile'
import { GraduationHistorySection } from '../features/academy/sections/GraduationHistorySection'
import { AttendanceHistorySection } from '../features/academy/sections/AttendanceHistorySection'
import { UserIcon, LoaderIcon, TrashIcon } from '../assets/icons'

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadPhoto = useUploadPhoto()
  const removePhoto = useRemovePhoto()

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadPhoto.mutate(file)
    e.target.value = '' // allow re-selecting the same file
  }

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

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
        <div className="relative h-20 w-20 shrink-0">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
              <UserIcon size={28} />
            </div>
          )}
          {uploadPhoto.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <LoaderIcon size={20} className="animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{translate('profile.photo')}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{translate('profile.photoHint')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              {profile?.photoUrl ? translate('profile.changePhoto') : translate('profile.uploadPhoto')}
            </button>
            {profile?.photoUrl && (
              <button
                type="button"
                onClick={() => removePhoto.mutate()}
                disabled={removePhoto.isPending}
                className="flex items-center gap-1 rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
              >
                <TrashIcon size={12} /> {translate('profile.removePhoto')}
              </button>
            )}
          </div>
          {uploadPhoto.isError && (
            <p className="mt-2 text-xs text-rose-500">{translate('profile.photoError')}</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{translate('profile.belt')}</label>
              <select
                {...register('belt')}
                className="w-full rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)]"
              >
                <option value="">—</option>
                {BELT_GROUPS.map(group => (
                  <optgroup key={group.groupKey} label={translate(group.groupKey)}>
                    {group.belts.map(b => (
                      <option key={b} value={b}>{translate(beltKey(b))}</option>
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
              {apiErrorMessage(mutation.error) ?? translate('profile.failed')}
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

      {profile && (
        <div className="mt-10">
          <GraduationHistorySection variant="mine-all" userId={profile.id} />
        </div>
      )}

      {profile && (
        <div className="mt-10">
          <AttendanceHistorySection variant="mine-all" userId={profile.id} />
        </div>
      )}
    </div>
  )
}
