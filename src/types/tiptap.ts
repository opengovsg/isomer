import type { IsomerThemes } from "./site"

export interface IsomerTiptapNode {
  content?: string
  priority?: number
  attributes?: Record<string, string | null>
  atom?: boolean
  selectable?: boolean
  defining?: boolean
  isolation?: boolean
}

export interface IsomerTiptapOptions {
  theme: IsomerThemes
}
