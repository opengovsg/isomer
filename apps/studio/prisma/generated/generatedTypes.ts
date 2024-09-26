import type { ColumnType, GeneratedAlways } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ResourceState, ResourceType, RoleType } from "./generatedEnums";

export type Blob = {
    id: GeneratedAlways<string>;
    /**
     * @kyselyType(PrismaJson.BlobJsonContent)
     * [BlobJsonContent]
     */
    content: PrismaJson.BlobJsonContent;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Footer = {
    id: GeneratedAlways<number>;
    siteId: number;
    /**
     * @kyselyType(PrismaJson.FooterJsonContent)
     * [FooterJsonContent]
     */
    content: PrismaJson.FooterJsonContent;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Navbar = {
    id: GeneratedAlways<number>;
    siteId: number;
    /**
     * @kyselyType(PrismaJson.NavbarJsonContent)
     * [NavbarJsonContent]
     */
    content: PrismaJson.NavbarJsonContent;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Permission = {
    id: GeneratedAlways<number>;
    resourceId: string;
    userId: string;
    role: RoleType;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
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
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
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
    codeBuildId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type SiteMember = {
    userId: string;
    siteId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    preferredName: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type VerificationToken = {
    identifier: string;
    token: string;
    prefix: string;
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
    updatedAt: Generated<Timestamp>;
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
