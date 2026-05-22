import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

export function useAcademySearch(query: string, page: number, size = 20) {
  return useQuery({
    queryKey: academyKeys.search(query, page),
    queryFn: () => academyApi.search(query, page, size),
  })
}
