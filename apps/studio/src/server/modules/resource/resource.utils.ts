export const tokenizeSearchQuery = (query: string): string[] => [
  ...new Set(query.trim().toLowerCase().split(/\s+/).filter(Boolean)),
]
