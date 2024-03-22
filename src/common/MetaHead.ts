import { IsomerLayout } from "~/engine"

export interface MetaHeadProps {
  type: "metahead"
  title: string
  description?: string
  noIndex?: boolean
  favicon?: string
  layout?: IsomerLayout
}

export default MetaHeadProps
