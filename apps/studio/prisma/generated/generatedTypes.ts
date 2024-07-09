import type { ColumnType, GeneratedAlways } from "kysely"

import type { RoleType } from "./generatedEnums"

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Blob {
  id: GeneratedAlways<number>
  content: unknown
}
export interface Footer {
  id: GeneratedAlways<number>
  siteId: number
  content: unknown
}
export interface Navbar {
  id: GeneratedAlways<number>
  siteId: number
  content: unknown
}
export interface Permission {
  id: GeneratedAlways<number>
  resourceId: number
  userId: string
  role: RoleType
}
export interface Resource {
  id: GeneratedAlways<number>
  name: string
  siteId: number
  parentId: number | null
  blobId: number | null
}
export interface Site {
  id: GeneratedAlways<number>
  name: string
  config: unknown
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
}
