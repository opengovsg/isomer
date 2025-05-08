import type { LinkComponentType } from "~/types"

export interface BreadcrumbLink {
  title: string
  url: string
}
export interface BreadcrumbProps {
  links: BreadcrumbLink[]
  LinkComponent?: LinkComponentType
  colorScheme?: "default" | "inverse"
}
