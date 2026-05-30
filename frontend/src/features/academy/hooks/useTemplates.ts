import { useQuery } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'

export function useTemplates(academyId: string | undefined, page = 0) {
  return useQuery({
    queryKey: academyId ? [...academyKeys.templates(academyId), page] : ['__none__'],
    queryFn: () => academyApi.listTemplates(academyId!, page),
    enabled: !!academyId,
  })
}

export function useTemplate(academyId: string | undefined, templateId: string | undefined) {
  return useQuery({
    queryKey:
      academyId && templateId
        ? [...academyKeys.templates(academyId), templateId]
        : ['__none__'],
    queryFn: () => academyApi.getTemplate(academyId!, templateId!),
    enabled: !!academyId && !!templateId,
  })
}
