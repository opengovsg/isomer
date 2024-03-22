import { IsomerLayout } from "~/engine"

export interface MetaHeadProps {
  type: "metahead"
  title: string
  description?: string
  noIndex?: boolean
  favicon?: string
  layout?: IsomerLayout
  HeadComponent?: any // Next.js Head
}

export default MetaHeadProps
