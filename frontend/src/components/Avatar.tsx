import { UserIcon } from '../assets/icons'

/**
 * User avatar — shows the profile photo when available, otherwise a generic
 * user icon on a neutral circle. Size is in pixels.
 */
export function Avatar({
  photoUrl,
  name,
  size = 36,
  className = '',
}: {
  photoUrl?: string | null
  name?: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] ${className}`}
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <UserIcon size={Math.round(size * 0.55)} />
      )}
    </span>
  )
}
