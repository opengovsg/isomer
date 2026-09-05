import { expect } from "@playwright/test"

import { getActiveUserPermissionOnSite, getUserRoleOnSite } from "./db"

export const expectUserRoleOnSite = (siteId: number, email: string) =>
  expect.poll(() => getUserRoleOnSite(siteId, email))

/** No active sitewide permission (e.g. after remove-user). */
export const expectUserAbsentOnSite = (siteId: number, email: string) =>
  expect.poll(() => getActiveUserPermissionOnSite(siteId, email))
