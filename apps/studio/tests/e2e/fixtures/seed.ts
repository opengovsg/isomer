import { createId } from "@paralleldrive/cuid2"
import { db } from "~/server/modules/database"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"

const SEED_SITE_ID = 1

/** @deprecated for mutating tests — use provisionE2ESite() */
export const getSeedSiteId = () => SEED_SITE_ID

/**
 * Idempotent: inserts user if missing, then ensures a ResourcePermission
 * with `role` on the seed site exists (re-activating if soft-deleted).
 *
 * The unique constraint on ResourcePermission is
 * (userId, siteId, resourceId, deletedAt) NULLS NOT DISTINCT.
 * We conflict on that constraint so that a second run with deletedAt=NULL
 * is a no-op (we just update the role to the desired value).
 */
const ensureUserWithRole = async (
  email: string,
  role: (typeof RoleType)[keyof typeof RoleType] | null,
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
      siteId: SEED_SITE_ID,
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
) => {
  const user = await ensureUserWithRole(email, null)

  await db
    .insertInto("IsomerAdmin")
    .values({ userId: user.id, role, expiry: null })
    .onConflict((oc) =>
      oc.columns(["userId", "role"]).doUpdateSet({ expiry: null }),
    )
    .execute()
}

export const seedRolesForE2E = async () => {
  await ensureUserWithRole(TEST_EMAILS.admin, RoleType.Admin)
  await ensureUserWithRole(TEST_EMAILS.nomember, null)
  // editor + publisher are seeded by prisma/seed.ts; ensure they're still active
  await ensureUserWithRole(TEST_EMAILS.editor, RoleType.Editor)
  await ensureUserWithRole(TEST_EMAILS.publisher, RoleType.Publisher)
  await ensureGodModeAdmin(TEST_EMAILS.core, IsomerAdminRole.Core)
  await ensureGodModeAdmin(TEST_EMAILS.migrator, IsomerAdminRole.Migrator)
}
