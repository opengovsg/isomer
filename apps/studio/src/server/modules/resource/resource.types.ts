import {
  type IsomerPageSchemaType,
  type IsomerSiteProps,
} from "@opengovsg/isomer-components"

import type { Resource, ResourceType } from "~server/db"

export type PageContent = Omit<
  IsomerPageSchemaType,
  "layout" | "LinkComponent" | "ScriptComponent"
>

export type Page = Resource

export type Navbar = Pick<IsomerSiteProps["navbar"], "items" | "callToAction">

export type Footer = IsomerSiteProps["footerItems"]

export interface SearchResultResource {
  id: string
  title: string
  type: ResourceType
  parentId: string | null
  lastUpdatedAt: Date | null
  fullPermalink: string
}
