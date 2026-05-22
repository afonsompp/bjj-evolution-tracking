import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'
import type { AcademyRequest } from '../../../types/api'

export function useUpdateAcademy(academyId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AcademyRequest) => academyApi.update(academyId!, body),
    onSuccess: (data) => {
      if (!academyId) return
      qc.setQueryData(academyKeys.detail(academyId), data)
      qc.invalidateQueries({ queryKey: academyKeys.all })
    },
  })
}
