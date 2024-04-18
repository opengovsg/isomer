import type BreadcrumbProps from "./Breadcrumb"
import type CollectionCardProps from "./CollectionCard"

export interface ArticlePageHeaderProps {
  breadcrumb: BreadcrumbProps
  title: string
  category: CollectionCardProps["category"]
  date: CollectionCardProps["lastUpdated"]
  summary: string[]
  LinkComponent?: any
}

export default ArticlePageHeaderProps
