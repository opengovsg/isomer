import type BreadcrumbProps from "./Breadcrumb"

export interface ArticlePageHeaderProps {
  breadcrumb: BreadcrumbProps
  category: string
  title: string
  date: string
  summary: string[]
  LinkComponent?: any
}

export default ArticlePageHeaderProps
