import type { Build } from "@aws-sdk/client-codebuild"
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

export type Navbar = IsomerSiteProps["navbar"]

export type Footer = IsomerSiteProps["footerItems"]

export interface SearchResultResource {
  id: string
  title: string
  type: ResourceType
  parentId: string | null
  lastUpdatedAt: Date | null
  fullPermalink: string
}

export interface PublishSiteWithNewBuild {
  startedBuild: Required<Pick<Build, "id" | "startTime">>
  stoppedBuild?: Required<Pick<Build, "id" | "startTime">>
  isNewBuildNeeded: true
}

export interface PublishSiteWithoutNewBuild {
  latestRunningBuild: Required<Pick<Build, "id" | "startTime">>
  isNewBuildNeeded: false
}

export type PublishSiteResult =
  | PublishSiteWithNewBuild
  | PublishSiteWithoutNewBuild
