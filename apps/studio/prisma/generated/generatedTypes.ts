import type { ColumnType, GeneratedAlways } from "kysely"

import type { ResourceState, ResourceType, RoleType } from "./generatedEnums"

export type Blob = {
    id: GeneratedAlways<string>;
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
    resourceId: string;
    userId: string;
    role: RoleType;
};
export type Resource = {
    id: GeneratedAlways<string>;
    title: string;
    permalink: string;
    siteId: number;
    parentId: string | null;
    publishedVersionId: string | null;
    draftBlobId: string | null;
    state: Generated<ResourceState | null>;
    type: ResourceType;
};
export type Site = {
    id: GeneratedAlways<number>;
    name: string;
    /**
     * @kyselyType(PrismaJson.SiteJsonConfig)
     * [SiteJsonConfig]
     */
    config: PrismaJson.SiteJsonConfig;
    /**
     * @kyselyType(PrismaJson.SiteThemeJson)
     * [SiteThemeJson]
     */
    theme: PrismaJson.SiteThemeJson | null;
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
export type Version = {
    id: GeneratedAlways<string>;
    versionNum: number;
    resourceId: string;
    blobId: string;
    publishedAt: Generated<Timestamp>;
    publishedBy: string;
};
export type DB = {
    Blob: Blob;
    Footer: Footer;
    Navbar: Navbar;
    Permission: Permission;
    Resource: Resource;
    Site: Site;
    SiteMember: SiteMember;
    User: User;
    VerificationToken: VerificationToken;
    Version: Version;
};
