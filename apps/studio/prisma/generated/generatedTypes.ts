import type { ColumnType } from "kysely"
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

import type { RoleType } from "./generatedEnums"

export type Blob = {
  id: string
  content: unknown
}
export type Footer = {
  id: string
  name: string
  siteId: string
  content: unknown
}
export type Navbar = {
  id: string
  siteId: string
  content: unknown
}
export type Permission = {
  id: string
  resourceId: string
  userId: string
  role: RoleType
}
export type Resource = {
  id: string
  name: string
  siteId: string
  parentId: string | null
  blobId: string | null
}
export type Site = {
  id: string
  name: string
  config: unknown
}
export type SiteMember = {
  userId: string
  siteId: string
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
