export const ResourceState = {
  Draft: "Draft",
  Published: "Published",
} as const
export type ResourceState = (typeof ResourceState)[keyof typeof ResourceState]
export const ResourceType = {
  RootPage: "RootPage",
  Page: "Page",
  Folder: "Folder",
  Collection: "Collection",
  CollectionMeta: "CollectionMeta",
  CollectionLink: "CollectionLink",
  CollectionPage: "CollectionPage",
  IndexPage: "IndexPage",
  FolderMeta: "FolderMeta",
} as const
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]
export const RoleType = {
  Admin: "Admin",
  Editor: "Editor",
  Publisher: "Publisher",
} as const
export type RoleType = (typeof RoleType)[keyof typeof RoleType]
export const AuditLogEvent = {
  ResourceCreate: "ResourceCreate",
  ResourceUpdate: "ResourceUpdate",
  ResourceDelete: "ResourceDelete",
  ResourceSchedule: "ResourceSchedule",
  CancelResourceSchedule: "CancelResourceSchedule",
  UserCreate: "UserCreate",
  UserUpdate: "UserUpdate",
  UserDelete: "UserDelete",
  Publish: "Publish",
  Login: "Login",
  Logout: "Logout",
  PermissionCreate: "PermissionCreate",
  PermissionUpdate: "PermissionUpdate",
  PermissionDelete: "PermissionDelete",
  SiteConfigUpdate: "SiteConfigUpdate",
  FooterUpdate: "FooterUpdate",
  NavbarUpdate: "NavbarUpdate",
} as const
export type AuditLogEvent = (typeof AuditLogEvent)[keyof typeof AuditLogEvent]
