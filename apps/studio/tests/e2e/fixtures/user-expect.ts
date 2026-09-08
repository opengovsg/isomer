import { expect } from "@playwright/test"

import { getActiveSitePermissionId, getUserRoleOnSite } from "./user.db"

export const expectUserRoleOnSite = (siteId: number, email: string) =>
  expect.poll(async () => {
    const row = await getUserRoleOnSite({ siteId, email })
    return row?.role ?? null
  })

/** Active sitewide permission absent (e.g. after remove-user). */
export const expectUserAbsentOnSite = (siteId: number, email: string) =>
  expect.poll(async () => {
    const row = await getActiveSitePermissionId({ siteId, email })
    return row ?? null
  })
