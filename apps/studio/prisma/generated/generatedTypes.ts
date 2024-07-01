import type { ColumnType, GeneratedAlways } from "kysely"
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

import type { RoleType } from "./generatedEnums"

export type Blob = {
  id: GeneratedAlways<number>
  content: unknown
}
export type Footer = {
  id: GeneratedAlways<number>
  siteId: number
  content: unknown
}
export type Navbar = {
  id: GeneratedAlways<number>
  siteId: number
  content: unknown
}
export type Permission = {
  id: GeneratedAlways<number>
  resourceId: number
  userId: string
  role: RoleType
}
export type Resource = {
  id: GeneratedAlways<number>
  name: string
  siteId: number
  parentId: number | null
  blobId: number | null
}
export type Site = {
  id: GeneratedAlways<number>
  name: string
  config: unknown
}
export type SiteMember = {
  userId: string
  siteId: number
}
export type User = {
  id: string
  name: string
  email: string
  phone: string
  preferredName: string | null
}
export type VerificationToken = {
  identifier: string
  token: string
  attempts: Generated<number>
  expires: Timestamp
}
export type DB = {
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
