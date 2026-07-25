import crypto from "crypto"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupUser,
} from "tests/integration/helpers/seed"
import { MOCK_STORY_DATE } from "tests/msw/constants"
import { db } from "~/server/modules/database"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

export const uniqueInviteeEmail = () =>
  `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const uniqueVendorEmail = () =>
  `e2e-vendor-${crypto.randomUUID().slice(0, 8)}@vendor.example.com`

export const uniqueLoggedInUserEmail = () =>
  `e2e-logged-in-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const uniqueIsomerAdminEmail = () =>
  `e2e-isomer-admin-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const seedLoggedInEditorOnSite = async ({
  siteId,
  email = uniqueLoggedInUserEmail(),
}: {
  siteId: number
  email?: string
}) => {
  const user = await setupUser({
    email,
    name: "Logged In User",
    lastLoginAt: MOCK_STORY_DATE,
  })
  await setupEditorPermissions({ userId: user.id, siteId })
  return { email, userId: user.id }
}

export const seedIsomerAdminOnSite = async ({
  siteId,
  email = uniqueIsomerAdminEmail(),
}: {
  siteId: number
  email?: string
}) => {
  const user = await setupUser({
    email,
    name: "E2E Isomer Admin",
    lastLoginAt: MOCK_STORY_DATE,
  })
  await setupAdminPermissions({ userId: user.id, siteId })
  await db
    .insertInto("IsomerAdmin")
    .values({
      userId: user.id,
      role: IsomerAdminRole.Core,
      expiry: null,
    })
    .execute()
  return { email, userId: user.id }
}

export const insertUserWithoutSites = (email: string) =>
  db
    .insertInto("User")
    .values({
      email,
      id: crypto.randomUUID().toString(),
      name: "",
      phone: "",
    })
    .execute()
