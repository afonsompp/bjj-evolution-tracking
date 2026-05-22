export const trainingKeys = {
  all: ['trainings'] as const,
  list: (page: number, size: number, startDate?: string, endDate?: string) =>
    [...trainingKeys.all, 'list', page, size, startDate, endDate] as const,
  one: (id: string | number) => [...trainingKeys.all, 'one', String(id)] as const,
  dashboard: ['dashboard'] as const,
}
