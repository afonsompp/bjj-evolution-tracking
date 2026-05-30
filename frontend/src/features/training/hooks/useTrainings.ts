import { useQuery } from '@tanstack/react-query'
import { trainingApi } from '../api/trainingApi'
import { trainingKeys } from '../api/keys'

export function useTrainings(page: number, size: number, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: trainingKeys.list(page, size, startDate, endDate),
    queryFn: () => trainingApi.list(page, size, startDate, endDate),
  })
}

export function useTraining(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: id ? trainingKeys.one(id) : trainingKeys.one('__none__'),
    queryFn: () => trainingApi.get(id!),
    enabled: !!id && enabled,
  })
}
