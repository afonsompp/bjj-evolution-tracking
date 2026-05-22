export const techniqueKeys = {
  all: ['techniques'] as const,
  list: (query: string, page: number) =>
    [...techniqueKeys.all, 'list', query, page] as const,
  search: (query: string) =>
    [...techniqueKeys.all, 'search', query] as const,
}
