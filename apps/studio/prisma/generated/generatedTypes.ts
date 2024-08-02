import type { ColumnType, GeneratedAlways } from "kysely"

import type { ResourceState, ResourceType, RoleType } from "./generatedEnums"

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Blob {
  id: GeneratedAlways<string>
  /**
   * @kyselyType(PrismaJson.BlobJsonContent)
   * [BlobJsonContent]
   */
  content: PrismaJson.BlobJsonContent
}
export interface Footer {
  id: GeneratedAlways<number>
  siteId: number
  /**
   * @kyselyType(PrismaJson.FooterJsonContent)
   * [FooterJsonContent]
   */
  content: PrismaJson.FooterJsonContent
}
export interface Navbar {
  id: GeneratedAlways<number>
  siteId: number
  /**
   * @kyselyType(PrismaJson.NavbarJsonContent)
   * [NavbarJsonContent]
   */
  content: PrismaJson.NavbarJsonContent
}
export interface Permission {
  id: GeneratedAlways<number>
  resourceId: string
  userId: string
  role: RoleType
}
export interface Resource {
  id: GeneratedAlways<string>
  title: string
  permalink: string
  siteId: number
  parentId: string | null
  publishedVersionId: string | null
  draftBlobId: string | null
  state: Generated<ResourceState | null>
  type: ResourceType
}
export interface Site {
  id: GeneratedAlways<number>
  name: string
  /**
   * @kyselyType(PrismaJson.SiteJsonConfig)
   * [SiteJsonConfig]
   */
  config: PrismaJson.SiteJsonConfig
}
export interface SiteMember {
  userId: string
  siteId: number
}
export interface User {
  id: string
  name: string
  email: string
  phone: string
  preferredName: string | null
}
export interface VerificationToken {
  identifier: string
  token: string
  attempts: Generated<number>
  expires: Timestamp
}
export interface Version {
  id: GeneratedAlways<string>
  versionNum: number
  resourceId: string
  blobId: string
  publishedAt: Generated<Timestamp>
  publishedBy: string
}
export interface DB {
  Blob: Blob
  Footer: Footer
  Navbar: Navbar
  Permission: Permission
  Resource: Resource
  Site: Site
  SiteMember: SiteMember
  User: User
  VerificationToken: VerificationToken
  Version: Version
}
