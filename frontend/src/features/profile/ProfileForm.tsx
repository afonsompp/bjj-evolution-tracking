import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n/I18nContext'
import { BELT_GROUPS, beltKey } from '../../lib/i18n/belts'
import type { ProfileRequest, Belt } from '../../types/api'
import { apiErrorMessage } from '../../lib/apiError'
import { useUpsertProfile, useUploadPhoto } from './useProfile'
import { UserIcon } from '../../assets/icons'

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

export default function ProfileForm() {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useUpsertProfile()
  const uploadPhoto = useUploadPhoto()

  // The backend only accepts a photo for an existing profile, so the file is
  // held locally during onboarding and uploaded right after the profile is created.
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState(false)

  // Track the live object URL in a ref so we can revoke the previous one on
  // replace and the last one on unmount, without re-running an effect on change.
  const previewUrlRef = useRef<string | null>(null)
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const setPhoto = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = file ? URL.createObjectURL(file) : null
    previewUrlRef.current = url
    setPhotoFile(file)
    setPreviewUrl(url)
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPhoto(file)
    e.target.value = '' // allow re-selecting the same file
  }

  const submit = (data: FormValues) => {
    setPhotoError(false)
    mutation.mutate(toRequest(data), {
      onSuccess: async () => {
        if (photoFile) {
          try {
            await uploadPhoto.mutateAsync(photoFile)
          } catch {
            // Profile is saved; surface the photo failure and let them retry
            // (re-submitting just updates the existing profile and re-uploads).
            setPhotoError(true)
            return
          }
        }
        navigate('/dashboard')
      },
    })
  }

  const pending = mutation.isPending || uploadPhoto.isPending

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-16 w-16 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center text-[var(--text-muted)]">
              <UserIcon size={24} />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-[var(--text-primary)]">{translate('profile.photo')}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {photoFile ? translate('profile.changePhoto') : translate('profile.uploadPhoto')}
            </button>
            {photoFile && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
              >
                {translate('profile.removePhoto')}
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="onboarding-photo-input"
          onChange={handlePhotoChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm text-[var(--text-muted)]">{translate('profile.name')}</label>
          <input id="profile-name" {...register('name')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]" />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="profile-secondName" className="block text-sm text-[var(--text-muted)]">{translate('profile.secondName')}</label>
          <input id="profile-secondName" {...register('secondName')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]" />
        </div>
      </div>

      <div>
        <label htmlFor="profile-nickname" className="block text-sm text-[var(--text-muted)]">{translate('profile.nickname')}</label>
        <input id="profile-nickname" {...register('nickname')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]" />
        {errors.nickname && <p className="mt-1 text-xs text-red-400">{errors.nickname.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="profile-belt" className="block text-sm text-[var(--text-muted)]">{translate('profile.belt')}</label>
          <select id="profile-belt" {...register('belt')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]">
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
          <label htmlFor="profile-beltStripe" className="block text-sm text-[var(--text-muted)]">{translate('profile.beltStripe')}</label>
          <input id="profile-beltStripe" type="number" min={0} max={4} {...register('beltStripe')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]" />
        </div>
        <div>
          <label htmlFor="profile-startsIn" className="block text-sm text-[var(--text-muted)]">{translate('profile.started')}</label>
          <input id="profile-startsIn" type="date" {...register('startsIn')} className="mt-1 w-full rounded border border-[var(--border-select)] bg-[var(--bg-select)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)] focus:border-[var(--border-card-hover)]" />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">{apiErrorMessage(mutation.error) ?? translate('profile.failed')}</p>
      )}

      {photoError && (
        <p className="text-sm text-red-400">{translate('profile.photoError')}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-page)] hover:opacity-90 disabled:opacity-50"
      >
        {pending ? translate('profile.saving') : translate('profile.save')}
      </button>
    </form>
  )
}
