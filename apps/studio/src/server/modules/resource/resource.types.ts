import { type IsomerSiteProps } from "@opengovsg/isomer-components"

import type { Resource, ResourceType } from "~server/db"

export type Page = Resource

export type Navbar = IsomerSiteProps["navbar"]

export interface SearchResultResource {
  id: string
  title: string
  type: ResourceType
  parentId: string | null
  lastUpdatedAt: Date | null
  fullPermalink: string
}
