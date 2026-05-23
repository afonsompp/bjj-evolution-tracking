import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'
import type { AcademyRequest } from '../../../types/api'

export function useCreateAcademy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AcademyRequest) => academyApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.all })
    },
  })
}
