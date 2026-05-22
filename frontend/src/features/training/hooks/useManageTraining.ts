import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trainingApi } from '../api/trainingApi'
import { trainingKeys } from '../api/keys'
import type { TrainingRequest } from '../../../types/api'

export function useCreateTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TrainingRequest) => trainingApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainingKeys.all })
      qc.invalidateQueries({ queryKey: trainingKeys.dashboard })
    },
  })
}

export function useUpdateTraining(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TrainingRequest) => trainingApi.update(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainingKeys.all })
      qc.invalidateQueries({ queryKey: trainingKeys.dashboard })
      if (id) qc.invalidateQueries({ queryKey: trainingKeys.one(id) })
    },
  })
}

export function useDeleteTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => trainingApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainingKeys.all })
      qc.invalidateQueries({ queryKey: trainingKeys.dashboard })
    },
  })
}
