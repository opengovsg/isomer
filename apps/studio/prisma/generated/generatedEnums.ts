export const ResourceState = {
    Draft: "Draft",
    Published: "Published"
} as const;
export type ResourceState = (typeof ResourceState)[keyof typeof ResourceState];
export const ResourceType = {
    RootPage: "RootPage",
    Page: "Page",
    Folder: "Folder",
    Collection: "Collection",
    CollectionMeta: "CollectionMeta",
    CollectionLink: "CollectionLink",
    CollectionPage: "CollectionPage",
    IndexPage: "IndexPage",
    FolderMeta: "FolderMeta"
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
export const RoleType = {
    Admin: "Admin",
    Editor: "Editor",
    Publisher: "Publisher"
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];
