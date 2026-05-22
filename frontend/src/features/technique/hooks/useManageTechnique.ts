import { useMutation, useQueryClient } from '@tanstack/react-query'
import { techniqueApi } from '../api/techniqueApi'
import { techniqueKeys } from '../api/keys'
import type { TechniqueRequest } from '../../../types/api'

export function useCreateTechnique() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TechniqueRequest) => techniqueApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: techniqueKeys.all })
    },
  })
}

export function useUpdateTechnique() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TechniqueRequest }) =>
      techniqueApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: techniqueKeys.all })
    },
  })
}

export function useDeleteTechnique() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => techniqueApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: techniqueKeys.all })
    },
  })
}
