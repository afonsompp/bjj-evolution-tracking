import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { techniqueApi } from '../api/techniqueApi'
import { techniqueKeys } from '../api/keys'

export function useTechniques(query: string, page: number, size = 20) {
  return useQuery({
    queryKey: techniqueKeys.list(query, page),
    queryFn: () => techniqueApi.list(query, page, size),
  })
}

export function useTechniqueSearch(query: string, size: number) {
  return useInfiniteQuery({
    queryKey: techniqueKeys.search(query),
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) => techniqueApi.list(query, pageParam, size),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  })
}
