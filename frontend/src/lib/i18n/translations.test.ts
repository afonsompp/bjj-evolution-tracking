import { describe, it, expect } from 'vitest'
import { t, en, pt, type TranslationKey } from './translations'

describe('t', () => {
  it('returns the plain string for a key without params', () => {
    expect(t('en-US', 'nav.dashboard')).toBe('Dashboard')
    expect(t('pt-BR', 'nav.signOut')).toBe('Sair')
  })

  it('substitutes a single named parameter', () => {
    expect(t('en-US', 'dashboard.period', { days: 30 })).toBe('Last 30 days')
    expect(t('pt-BR', 'dashboard.period', { days: 7 })).toBe('Últimos 7 dias')
  })

  it('substitutes every occurrence and supports string params', () => {
    expect(t('en-US', 'history.pageOf', { page: 2, total: 5 })).toBe('Page 2 of 5')
    expect(t('en-US', 'academy.leaveConfirm', { name: 'Evolution BJJ' })).toBe(
      'Are you sure you want to leave Evolution BJJ?',
    )
  })

  it('leaves the placeholder intact when a param is missing', () => {
    expect(t('en-US', 'dashboard.period', {})).toBe('Last {days} days')
    expect(t('en-US', 'history.pageOf', { page: 2 })).toBe('Page 2 of {total}')
  })

  it('falls back to the key itself for an unknown key', () => {
    // Cast: deliberately exercising the missing-key runtime branch.
    expect(t('en-US', 'does.not.exist' as TranslationKey)).toBe('does.not.exist')
  })
})

describe('locale parity', () => {
  it('pt-BR defines exactly the same keys as en-US', () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort())
  })

  it('no translation value is empty', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en-US:${key}`).not.toBe('')
    }
    for (const [key, value] of Object.entries(pt)) {
      expect(value, `pt-BR:${key}`).not.toBe('')
    }
  })

  it('placeholders match between en-US and pt-BR for each key', () => {
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect(placeholders(pt[key]), `placeholders differ for ${key}`).toEqual(
        placeholders(en[key]),
      )
    }
  })
})
