import { createId } from "@paralleldrive/cuid2"
import { setUpWhitelist, setupSite } from "tests/integration/helpers/seed"
import { db } from "~/server/modules/database"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"

/**
 * Idempotent: inserts user if missing, then ensures a ResourcePermission
 * with `role` on `siteId` exists (re-activating if soft-deleted).
 *
 * The unique constraint on ResourcePermission is
 * (userId, siteId, resourceId, deletedAt) NULLS NOT DISTINCT.
 * We conflict on that constraint so that a second run with deletedAt=NULL
 * is a no-op (we just update the role to the desired value).
 */
const ensureUserWithRole = async (
  email: string,
  role: (typeof RoleType)[keyof typeof RoleType] | null,
  siteId: number,
) => {
  const user = await db
    .insertInto("User")
    .values({
      id: createId(),
      email,
      name: "test-e2e",
      phone: "82345678",
    })
    .onConflict((oc) =>
      oc
        .columns(["email", "deletedAt"])
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .returning(["id"])
    .executeTakeFirstOrThrow()

  if (role === null) {
    // The e2e suite relies on this user being permissionless. A prior run or
    // manual debugging may have granted them a ResourcePermission, so remove
    // any that exist to guarantee a clean, access-free state.
    await db
      .deleteFrom("ResourcePermission")
      .where("userId", "=", user.id)
      .execute()
    return user
  }

  await db
    .insertInto("ResourcePermission")
    .values({
      userId: user.id,
      siteId,
      role,
      resourceId: null,
    })
    .onConflict((oc) =>
      // Unique constraint: (userId, siteId, resourceId, deletedAt) NULLS NOT DISTINCT
      // When inserting with deletedAt=NULL, a conflict means an active row already
      // exists. We update the role to ensure it matches what we expect.
      oc
        .columns(["userId", "siteId", "resourceId", "deletedAt"])
        .doUpdateSet({ role }),
    )
    .execute()

  return user
}

const ensureGodModeAdmin = async (
  email: string,
  role: (typeof IsomerAdminRole)[keyof typeof IsomerAdminRole],
  siteId: number,
) => {
  const user = await ensureUserWithRole(email, null, siteId)

  await db
    .insertInto("IsomerAdmin")
    .values({ userId: user.id, role, expiry: null })
    .onConflict((oc) =>
      oc.columns(["userId", "role"]).doUpdateSet({ expiry: null }),
    )
    .execute()
}

export const seedRolesForE2E = async () => {
  // protectedProcedure's authMiddleware requires the caller's email to be
  // whitelisted (see whitelist.service.ts's isEmailWhitelisted), so every
  // TEST_EMAILS user (all @open.gov.sg) needs this domain whitelisted for
  // any tRPC call to succeed across the whole e2e suite. prisma/seed.ts
  // used to provide this row via CI's now-removed "Seed testing db" step;
  // it's self-provisioned here instead.
  await setUpWhitelist({ email: "@open.gov.sg" })

  const { site } = await setupSite()

  await ensureUserWithRole(TEST_EMAILS.admin, RoleType.Admin, site.id)
  await ensureUserWithRole(TEST_EMAILS.nomember, null, site.id)
  await ensureUserWithRole(TEST_EMAILS.editor, RoleType.Editor, site.id)
  await ensureUserWithRole(TEST_EMAILS.publisher, RoleType.Publisher, site.id)
  await ensureGodModeAdmin(TEST_EMAILS.core, IsomerAdminRole.Core, site.id)
  await ensureGodModeAdmin(
    TEST_EMAILS.migrator,
    IsomerAdminRole.Migrator,
    site.id,
  )
}
