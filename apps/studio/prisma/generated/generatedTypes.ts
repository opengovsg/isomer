import type { ColumnType, GeneratedAlways } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ResourceState, ResourceType, RoleType } from "./generatedEnums";

export type Blob = {
    id: GeneratedAlways<number>;
    /**
     * @kyselyType(PrismaJson.BlobJsonContent)
     * [BlobJsonContent]
     */
    content: PrismaJson.BlobJsonContent;
};
export type Footer = {
    id: GeneratedAlways<number>;
    siteId: number;
    /**
     * @kyselyType(PrismaJson.FooterJsonContent)
     * [FooterJsonContent]
     */
    content: PrismaJson.FooterJsonContent;
};
export type Navbar = {
    id: GeneratedAlways<number>;
    siteId: number;
    /**
     * @kyselyType(PrismaJson.NavbarJsonContent)
     * [NavbarJsonContent]
     */
    content: PrismaJson.NavbarJsonContent;
};
export type Permission = {
    id: GeneratedAlways<number>;
    resourceId: number;
    userId: string;
    role: RoleType;
};
export type Resource = {
    id: GeneratedAlways<number>;
    title: string;
    permalink: string;
    version: Generated<number>;
    siteId: number;
    parentId: number | null;
    mainBlobId: number | null;
    draftBlobId: number | null;
    state: Generated<ResourceState | null>;
    type: ResourceType;
};
export type ResourceVersions = {
    id: GeneratedAlways<number>;
    resourceId: number;
    blobId: number;
    version: number;
};
export type Site = {
    id: GeneratedAlways<number>;
    name: string;
    /**
     * @kyselyType(PrismaJson.SiteJsonConfig)
     * [SiteJsonConfig]
     */
    config: PrismaJson.SiteJsonConfig;
};
export type SiteMember = {
    userId: string;
    siteId: number;
};
export type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    preferredName: string | null;
};
export type VerificationToken = {
    identifier: string;
    token: string;
    attempts: Generated<number>;
    expires: Timestamp;
};
export type DB = {
    Blob: Blob;
    Footer: Footer;
    Navbar: Navbar;
    Permission: Permission;
    Resource: Resource;
    ResourceVersions: ResourceVersions;
    Site: Site;
    SiteMember: SiteMember;
    User: User;
    VerificationToken: VerificationToken;
};
