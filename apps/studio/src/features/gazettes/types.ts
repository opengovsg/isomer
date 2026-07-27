import type { GazetteCategories } from "./constants"

export type GazettesCategory =
  (typeof GazetteCategories)[keyof typeof GazetteCategories]
