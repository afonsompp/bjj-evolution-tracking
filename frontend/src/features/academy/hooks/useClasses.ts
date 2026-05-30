import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

interface UseClassesOptions {
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export function useClasses(academyId: string | undefined, opts: UseClassesOptions = {}) {
  const { startDate, endDate, page = 0, size = 30 } = opts
  return useQuery({
    queryKey: academyId
      ? [...academyKeys.classes(academyId), startDate, endDate, page]
      : ['__none__'],
    queryFn: () => academyApi.listClasses(academyId!, startDate, endDate, page, size),
    enabled: !!academyId,
  })
}

export function useClass(academyId: string | undefined, classId: string | undefined) {
  return useQuery({
    queryKey:
      academyId && classId
        ? [...academyKeys.classes(academyId), 'detail', classId]
        : ['__none__'],
    queryFn: () => academyApi.getClass(academyId!, classId!),
    enabled: !!academyId && !!classId,
  })
}
