import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useTranslation } from '../../lib/i18n/I18nContext'
import type { ProfileResponse, ProfileRequest, Belt } from '../../types/api'

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
  stripe: z.string().optional(),
  startsIn: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function toRequest(data: FormValues): ProfileRequest {
  return {
    name: data.name,
    secondName: data.secondName || undefined,
    nickname: data.nickname,
    belt: (data.belt || undefined) as Belt | undefined,
    stripe: data.stripe ? parseInt(data.stripe, 10) : undefined,
    startsIn: data.startsIn || undefined,
  }
}

export default function ProfileForm() {
  const navigate = useNavigate()
  const { translate } = useTranslation()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient.post<ProfileResponse>('/profiles', toRequest(data)).then(r => r.data),
    onSuccess: () => {
      navigate('/dashboard')
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400">{translate('profile.name')}</label>
          <input {...register('name')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-zinc-400">{translate('profile.secondName')}</label>
          <input {...register('secondName')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-zinc-400">{translate('profile.nickname')}</label>
        <input {...register('nickname')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        {errors.nickname && <p className="mt-1 text-xs text-red-400">{errors.nickname.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-zinc-400">{translate('profile.belt')}</label>
          <select {...register('belt')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
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
          <label className="block text-sm text-zinc-400">{translate('profile.stripe')}</label>
          <input type="number" min={0} max={4} {...register('stripe')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">{translate('profile.started')}</label>
          <input type="date" {...register('startsIn')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">{(mutation.error as any)?.response?.data?.message ?? translate('profile.failed')}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {mutation.isPending ? translate('profile.saving') : translate('profile.save')}
      </button>
    </form>
  )
}
