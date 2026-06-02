import { describe, it, expect } from 'vitest'
import {
  isValidISODate,
  isValidDateRange,
  isApplicableRange,
  isOutOfOrderRange,
  hasYearOverflow,
  MAX_DATE,
} from './dateValidation'

describe('isValidISODate', () => {
  it('accepts a well-formed ISO date', () => {
    expect(isValidISODate('2026-06-01')).toBe(true)
    expect(isValidISODate('2000-01-01')).toBe(true)
    expect(isValidISODate('2024-02-29')).toBe(true) // leap year
  })

  it('rejects the wrong shape', () => {
    expect(isValidISODate('')).toBe(false)
    expect(isValidISODate('2026-6-1')).toBe(false)
    expect(isValidISODate('2026/06/01')).toBe(false)
    expect(isValidISODate('06-01-2026')).toBe(false)
    expect(isValidISODate('2026-06-01T00:00:00Z')).toBe(false)
  })

  it('rejects calendar-invalid dates that match the shape', () => {
    expect(isValidISODate('2026-13-01')).toBe(false) // month 13
    expect(isValidISODate('2026-02-30')).toBe(false) // Feb 30 rolls over
    expect(isValidISODate('2025-02-29')).toBe(false) // non-leap year
    expect(isValidISODate('2026-00-10')).toBe(false) // month 00
  })
})

describe('isValidDateRange', () => {
  it('is true for two valid dates in order', () => {
    expect(isValidDateRange('2026-01-01', '2026-12-31')).toBe(true)
    expect(isValidDateRange('2026-06-01', '2026-06-01')).toBe(true) // equal bounds allowed
  })

  it('is false when start is after end', () => {
    expect(isValidDateRange('2026-12-31', '2026-01-01')).toBe(false)
  })

  it('is false when either side is invalid', () => {
    expect(isValidDateRange('', '2026-12-31')).toBe(false)
    expect(isValidDateRange('2026-01-01', 'nope')).toBe(false)
  })
})

describe('isApplicableRange', () => {
  it('allows both sides empty (filter off)', () => {
    expect(isApplicableRange('', '')).toBe(true)
  })

  it('allows an open-ended bound (one side empty)', () => {
    expect(isApplicableRange('2026-01-01', '')).toBe(true)
    expect(isApplicableRange('', '2026-12-31')).toBe(true)
  })

  it('allows a valid closed range', () => {
    expect(isApplicableRange('2026-01-01', '2026-12-31')).toBe(true)
  })

  it('rejects a non-empty invalid bound', () => {
    expect(isApplicableRange('2026-1-1', '')).toBe(false)
    expect(isApplicableRange('', 'garbage')).toBe(false)
  })

  it('rejects an out-of-order closed range', () => {
    expect(isApplicableRange('2026-12-31', '2026-01-01')).toBe(false)
  })
})

describe('isOutOfOrderRange', () => {
  it('flags only fully-valid, out-of-order ranges', () => {
    expect(isOutOfOrderRange('2026-12-31', '2026-01-01')).toBe(true)
  })

  it('does not flag in-order or equal ranges', () => {
    expect(isOutOfOrderRange('2026-01-01', '2026-12-31')).toBe(false)
    expect(isOutOfOrderRange('2026-06-01', '2026-06-01')).toBe(false)
  })

  it('does not flag partial / mid-typing input', () => {
    expect(isOutOfOrderRange('2026-12-31', '')).toBe(false)
    expect(isOutOfOrderRange('2026-1', '2026-01-01')).toBe(false)
  })
})

describe('hasYearOverflow', () => {
  it('is false for empty or normal years', () => {
    expect(hasYearOverflow('')).toBe(false)
    expect(hasYearOverflow('2026-06-01')).toBe(false)
    expect(hasYearOverflow('9999-12-31')).toBe(false)
  })

  it('is true when the year part exceeds 4 digits', () => {
    expect(hasYearOverflow('12026-06-01')).toBe(true)
    expect(hasYearOverflow('100000-01-01')).toBe(true)
  })

  it('is false when the year part is non-numeric', () => {
    expect(hasYearOverflow('abcde-06-01')).toBe(false)
  })
})

describe('MAX_DATE', () => {
  it('is a valid ISO date', () => {
    expect(isValidISODate(MAX_DATE)).toBe(true)
    expect(MAX_DATE).toBe('9999-12-31')
  })
})
