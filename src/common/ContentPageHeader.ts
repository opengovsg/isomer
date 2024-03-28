import BreadcrumbProps from "./Breadcrumb"

export interface ContentPageHeaderProps {
  type: "contentpageheader"
  title: string
  summary: string
  breadcrumb: BreadcrumbProps
  buttonLabel?: string
  buttonUrl?: string
  LinkComponent?: any
}

export default ContentPageHeaderProps
