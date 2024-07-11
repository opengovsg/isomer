import {
  type IsomerPageSchemaType,
  type IsomerSiteProps,
} from "@opengovsg/isomer-components"
import { type SetRequired } from "type-fest"

import type { Resource } from "~server/db"

export type PageContent = Omit<
  IsomerPageSchemaType,
  "layout" | "LinkComponent" | "ScriptComponent"
>

export type Page = SetRequired<Resource, "blobId">

export interface Navbar {
  items: IsomerSiteProps["navBarItems"]
}

export type Footer = IsomerSiteProps["footerItems"]
