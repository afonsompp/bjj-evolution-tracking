import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from '../../../lib/i18n/I18nContext'
import { useTechniqueSearch } from '../hooks/useTechniques'
import { CheckIcon, LoaderIcon, SearchIcon, XIcon } from '../../../assets/icons'
import type { TechniqueResponse, TechniqueType } from '../../../types/api'

export const TECHNIQUE_TYPE_ORDER: TechniqueType[] = [
  'SUBMISSION', 'POSITION', 'GUARD_POSITION', 'GUARD_PASS',
  'SWEEP', 'TAKEDOWN', 'PIN', 'SCAPE', 'GRIP',
]

export const TECHNIQUE_TYPE_LABELS: Record<TechniqueType, string> = {
  SUBMISSION: 'form.techType.SUBMISSION',
  POSITION: 'form.techType.POSITION',
  GUARD_POSITION: 'form.techType.GUARD_POSITION',
  GUARD_PASS: 'form.techType.GUARD_PASS',
  SWEEP: 'form.techType.SWEEP',
  TAKEDOWN: 'form.techType.TAKEDOWN',
  PIN: 'form.techType.PIN',
  SCAPE: 'form.techType.SCAPE',
  GRIP: 'form.techType.GRIP',
}

const PAGE_SIZE = 50

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function TechniquePicker({
  selectedIds,
  onChange,
  label,
  typeFilter,
}: {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  label: string
  typeFilter?: TechniqueType[]
}) {
  const { translate } = useTranslation()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } =
    useTechniqueSearch(debouncedSearch, PAGE_SIZE)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchNextPage() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  const allTechniques = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  )

  const filtered = useMemo(() => {
    let list = allTechniques
    if (typeFilter) list = list.filter((t) => typeFilter.includes(t.type))
    return list
  }, [allTechniques, typeFilter])

  const grouped = useMemo(() => {
    const map = new Map<TechniqueType, TechniqueResponse[]>()
    for (const t of filtered) {
      if (!map.has(t.type)) map.set(t.type, [])
      map.get(t.type)!.push(t)
    }
    return TECHNIQUE_TYPE_ORDER.filter((t) => map.has(t)).map((t) => ({
      type: t,
      items: map.get(t)!,
    }))
  }, [filtered])

  const toggle = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])

  const selectAllInGroup = (ids: number[]) =>
    onChange(Array.from(new Set([...selectedIds, ...ids])))

  const deselectAllInGroup = (ids: number[]) => {
    const exclude = new Set(ids)
    onChange(selectedIds.filter((i) => !exclude.has(i)))
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">{label}</label>
      <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--border-row)] px-4 py-2.5">
          <span className="text-[var(--text-subtle)]"><SearchIcon /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate('form.searchTechniques')}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
              <XIcon />
            </button>
          )}
          {isFetching && <span className="text-[var(--text-subtle)]"><LoaderIcon /></span>}
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--text-subtle)]">
              <LoaderIcon /> {translate('form.loadingTechniques')}
            </div>
          ) : grouped.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-subtle)]">
              {search ? translate('form.noTechniquesMatch') : translate('form.noTechniques')}
            </p>
          ) : (
            grouped.map(({ type, items }) => {
              const allSelected = items.every((t) => selectedIds.includes(t.id))
              const someSelected = items.some((t) => selectedIds.includes(t.id))
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        allSelected
                          ? deselectAllInGroup(items.map((t) => t.id))
                          : selectAllInGroup(items.map((t) => t.id))
                      }
                      className={`flex h-4 w-4 items-center justify-center rounded border text-xs transition-colors ${
                        allSelected
                          ? 'border-yellow-500 bg-yellow-500 text-yellow-950'
                          : someSelected
                            ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-500'
                            : 'border-[var(--border-card)] text-transparent'
                      }`}
                    >
                      {allSelected && <CheckIcon />}
                      {someSelected && !allSelected && <span className="text-[10px]">—</span>}
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                      {translate(TECHNIQUE_TYPE_LABELS[type])}
                    </span>
                    <span className="text-[10px] text-[var(--text-subtle)]">({items.length})</span>
                  </div>
                  <div className="ml-3 space-y-0.5 border-l border-[var(--border-row)] pl-2">
                    {items.map((t) => (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                      >
                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggle(t.id)} className="sr-only" />
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                            selectedIds.includes(t.id)
                              ? 'border-yellow-500 bg-yellow-500 text-yellow-950'
                              : 'border-[var(--border-card)]'
                          }`}
                        >
                          {selectedIds.includes(t.id) && <CheckIcon />}
                        </span>
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })
          )}
          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-3">
              <span className="text-xs text-[var(--text-subtle)]">
                {isFetchingNextPage ? translate('form.loadingMore') : translate('form.scrollForMore')}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border-row)] px-4 py-2 text-xs text-[var(--text-subtle)]">
          {(() => {
            const total = data?.pages[0]?.totalElements ?? 0
            return total > 0
              ? translate('form.selectedOf', { count: selectedIds.length, total })
              : translate('form.selectedCount', { count: selectedIds.length })
          })()}
        </div>
      </div>
    </div>
  )
}
