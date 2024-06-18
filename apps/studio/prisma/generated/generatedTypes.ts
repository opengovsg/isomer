import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ResourceType, RoleType, PageStatus } from "./generatedEnums";

export type Blob = {
    id: string;
    content: unknown;
};
export type Permission = {
    id: string;
    resourceId: string;
    userId: string;
    role: RoleType;
};
export type Resource = {
    id: string;
    name: string;
    siteId: string;
    parentId: string | null;
    lastEditTime: Timestamp | null;
    lastEditUserId: string;
    blobId: string | null;
    variant: ResourceType;
    status: PageStatus;
};
export type Site = {
    id: string;
    name: string;
};
export type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
};
export type VerificationToken = {
    identifier: string;
    token: string;
    attempts: Generated<number>;
    expires: Timestamp;
};
export type DB = {
    Blob: Blob;
    Permission: Permission;
    Resource: Resource;
    Site: Site;
    User: User;
    VerificationToken: VerificationToken;
};
