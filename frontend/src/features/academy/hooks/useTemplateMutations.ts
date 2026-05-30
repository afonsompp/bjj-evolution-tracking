import { useMutation, useQueryClient } from '@tanstack/react-query'
import { academyApi } from '../api/academyApi'
import { academyKeys } from '../api/keys'
import type { ClassTemplateRequest, GenerateClassesRequest } from '../../../types/api'

export function useCreateTemplate(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ClassTemplateRequest) => academyApi.createTemplate(academyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.templates(academyId) })
    },
  })
}

export function useUpdateTemplate(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, body }: { templateId: string; body: ClassTemplateRequest }) =>
      academyApi.updateTemplate(academyId, templateId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.templates(academyId) })
    },
  })
}

export function useDeleteTemplate(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) => academyApi.deleteTemplate(academyId, templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.templates(academyId) })
    },
  })
}

export function useGenerateFromTemplate(academyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      body,
    }: {
      templateId: string
      body: GenerateClassesRequest
    }) => academyApi.generateFromTemplate(academyId, templateId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.classes(academyId) })
      qc.invalidateQueries({ queryKey: academyKeys.schedule(academyId) })
    },
  })
}
