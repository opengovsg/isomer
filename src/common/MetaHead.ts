export interface MetaHeadProps {
  type: "metahead"
  title: string
  description?: string
  noIndex?: boolean
  favicon?: string
  HeadComponent?: any // Next.js Head
}

export default MetaHeadProps
