import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n/I18nContext'
import { BELT_GROUPS, beltKey } from '../../lib/i18n/belts'
import type { ProfileRequest, Belt } from '../../types/api'
import { apiErrorMessage } from '../../lib/apiError'
import { useUpsertProfile } from './useProfile'

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
  const submit = (data: FormValues) =>
    mutation.mutate(toRequest(data), { onSuccess: () => navigate('/dashboard') })

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm text-zinc-400">{translate('profile.name')}</label>
          <input id="profile-name" {...register('name')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="profile-secondName" className="block text-sm text-zinc-400">{translate('profile.secondName')}</label>
          <input id="profile-secondName" {...register('secondName')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
      </div>

      <div>
        <label htmlFor="profile-nickname" className="block text-sm text-zinc-400">{translate('profile.nickname')}</label>
        <input id="profile-nickname" {...register('nickname')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        {errors.nickname && <p className="mt-1 text-xs text-red-400">{errors.nickname.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="profile-belt" className="block text-sm text-zinc-400">{translate('profile.belt')}</label>
          <select id="profile-belt" {...register('belt')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
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
          <label htmlFor="profile-beltStripe" className="block text-sm text-zinc-400">{translate('profile.beltStripe')}</label>
          <input id="profile-beltStripe" type="number" min={0} max={4} {...register('beltStripe')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label htmlFor="profile-startsIn" className="block text-sm text-zinc-400">{translate('profile.started')}</label>
          <input id="profile-startsIn" type="date" {...register('startsIn')} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">{apiErrorMessage(mutation.error) ?? translate('profile.failed')}</p>
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
