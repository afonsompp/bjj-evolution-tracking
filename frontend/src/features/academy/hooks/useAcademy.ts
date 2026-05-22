import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

export function useAcademy(id: string | undefined) {
  return useQuery({
    queryKey: id ? academyKeys.detail(id) : academyKeys.detail('__none__'),
    queryFn: () => academyApi.getById(id!),
    enabled: !!id,
  })
}
