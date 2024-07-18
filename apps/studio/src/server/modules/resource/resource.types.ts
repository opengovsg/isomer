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

// TODO: Technically mainBlobId is not required before 1st publish
export type Page = SetRequired<Resource, "mainBlobId">

export interface Navbar {
  items: IsomerSiteProps["navBarItems"]
}

export type Footer = IsomerSiteProps["footerItems"]
