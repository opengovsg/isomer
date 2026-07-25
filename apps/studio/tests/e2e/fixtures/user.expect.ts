import { expect } from "@playwright/test"

import { getActiveUserPermissionOnSite, getUserRoleOnSite } from "./user.db"

export const expectUserRoleOnSite = (siteId: number, email: string) =>
  expect.poll(() => getUserRoleOnSite(siteId, email))

/** Active sitewide permission absent (e.g. after remove-user). */
export const expectUserAbsentOnSite = (siteId: number, email: string) =>
  expect.poll(() => getActiveUserPermissionOnSite(siteId, email))
