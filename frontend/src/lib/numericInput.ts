import type { ChangeEvent } from 'react'

/**
 * Handles a numeric `<input>` change for a controlled, nullable number field.
 *
 * An empty field maps to `null` ("not recorded") so it stays distinct from an
 * explicit `0`, and it never snaps to `0` when cleared.
 *
 * It also strips leading zeros (e.g. "05" -> "5"). React bails out of
 * re-rendering when the parsed number is unchanged, which would otherwise leave
 * the raw "05" stuck in the field, so we normalize the input's value
 * imperatively in that case.
 */
export function handleIntInput(
  e: ChangeEvent<HTMLInputElement>,
  set: (v: number | null) => void,
): void {
  const raw = e.target.value
  if (raw === '') {
    set(null)
    return
  }
  const n = Number(raw)
  if (Number.isNaN(n)) return
  const normalized = String(n)
  if (normalized !== raw) e.target.value = normalized
  set(n)
}
