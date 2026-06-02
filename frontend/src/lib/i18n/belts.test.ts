import { describe, it, expect } from 'vitest'
import type { Belt } from '../../types/api'
import { BELT_GROUPS, ALL_BELTS, beltKey } from './belts'

describe('BELT_GROUPS', () => {
  it('exposes an adult and a youth group, in that order', () => {
    expect(BELT_GROUPS.map((g) => g.groupKey)).toEqual([
      'belt.group.adult',
      'belt.group.youth',
    ])
  })

  it('lists the five adult belts in progression order', () => {
    const adult = BELT_GROUPS.find((g) => g.groupKey === 'belt.group.adult')!
    expect(adult.belts).toEqual(['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK'])
  })
})

describe('ALL_BELTS', () => {
  it('is the flattened concatenation of every group, in order', () => {
    expect(ALL_BELTS).toEqual(BELT_GROUPS.flatMap((g) => g.belts))
  })

  it('contains no duplicates', () => {
    expect(new Set(ALL_BELTS).size).toBe(ALL_BELTS.length)
  })

  it('starts with WHITE and ends with the last youth belt', () => {
    expect(ALL_BELTS[0]).toBe('WHITE')
    expect(ALL_BELTS).toContain('GREEN_BLACK')
  })
})

describe('beltKey', () => {
  it('prefixes a belt value with "belt."', () => {
    expect(beltKey('WHITE')).toBe('belt.WHITE')
    expect(beltKey('GRAY_BLACK')).toBe('belt.GRAY_BLACK')
  })

  it('produces a key for every belt in ALL_BELTS', () => {
    for (const belt of ALL_BELTS) {
      expect(beltKey(belt)).toBe(`belt.${belt}`)
    }
  })

  it('returns a valid TranslationKey type at the call site', () => {
    const belt: Belt = 'BLUE'
    expect(beltKey(belt)).toBe('belt.BLUE')
  })
})
