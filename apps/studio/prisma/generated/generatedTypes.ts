import type { ColumnType, GeneratedAlways } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ResourceState, ResourceType, RoleType, AuditLogEvent } from "./generatedEnums";

export type AuditLog = {
    id: GeneratedAlways<string>;
    userId: string;
    siteId: number | null;
    eventType: AuditLogEvent;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    metadata: unknown;
    /**
     * @kyselyType(PrismaJson.AuditLogDeltaJsonContent)
     * [AuditLogDeltaJsonContent]
     */
    delta: PrismaJson.AuditLogDeltaJsonContent;
    ipAddress: string | null;
};
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
export type RateLimiterFlexible = {
    key: string;
    points: number;
    expire: Timestamp | null;
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
    pos: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type ResourcePermission = {
    id: GeneratedAlways<string>;
    userId: string;
    siteId: number;
    resourceId: string | null;
    role: RoleType;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    deletedAt: Timestamp | null;
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
export type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    singpassUuid: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    deletedAt: Timestamp | null;
    lastLoginAt: Timestamp | null;
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
    updatedAt: Generated<Timestamp>;
};
export type Whitelist = {
    id: GeneratedAlways<number>;
    email: string;
    expiry: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type DB = {
    AuditLog: AuditLog;
    Blob: Blob;
    Footer: Footer;
    Navbar: Navbar;
    RateLimiterFlexible: RateLimiterFlexible;
    Resource: Resource;
    ResourcePermission: ResourcePermission;
    Site: Site;
    User: User;
    VerificationToken: VerificationToken;
    Version: Version;
    Whitelist: Whitelist;
};
