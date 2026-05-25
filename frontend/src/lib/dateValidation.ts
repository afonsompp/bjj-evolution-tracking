export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  if (isNaN(d.getTime())) return false
  return d.toISOString().slice(0, 10) === s
}

export function isValidDateRange(start: string, end: string): boolean {
  return isValidISODate(start) && isValidISODate(end) && start <= end
}

// A range we can safely push to a query:
//   - both empty (filter off)
//   - one side empty, the other a valid ISO date (open-ended bound)
//   - both valid ISO dates AND start ≤ end (closed range)
export function isApplicableRange(start: string, end: string): boolean {
  if (start !== '' && !isValidISODate(start)) return false
  if (end !== '' && !isValidISODate(end)) return false
  if (start !== '' && end !== '' && start > end) return false
  return true
}

// True only when both sides parse as valid ISO dates but are out of order.
// Use this to show an inline "end before start" error without flagging
// partial / mid-typing input.
export function isOutOfOrderRange(start: string, end: string): boolean {
  return isValidISODate(start) && isValidISODate(end) && start > end
}

// Reject values whose year part exceeds 4 digits. <input type="date"> in
// some browsers (notably Chrome) will accept years up to 6 digits — this
// guard is for the onChange handler to drop those before they hit state.
export function hasYearOverflow(value: string): boolean {
  if (!value) return false
  const yearPart = value.split('-')[0] ?? ''
  return /^\d+$/.test(yearPart) && yearPart.length > 4
}

export const MAX_DATE = '9999-12-31'
