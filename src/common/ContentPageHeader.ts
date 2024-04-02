import BreadcrumbProps from "./Breadcrumb"

export interface ContentPageHeaderProps {
  title: string
  summary: string
  breadcrumb: BreadcrumbProps
  buttonLabel?: string
  buttonUrl?: string
  LinkComponent?: any
}

export default ContentPageHeaderProps
