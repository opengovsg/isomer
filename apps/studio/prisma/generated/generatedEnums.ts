export const ResourceType = {
    PageResource: "PageResource",
    FolderResource: "FolderResource"
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
export const RoleType = {
    Admin: "Admin",
    Editor: "Editor",
    Publisher: "Publisher"
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];
export const PageStatus = {
    Published: "Published",
    Draft: "Draft"
} as const;
export type PageStatus = (typeof PageStatus)[keyof typeof PageStatus];
