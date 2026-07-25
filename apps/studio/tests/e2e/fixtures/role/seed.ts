import { createId } from "@paralleldrive/cuid2"
import { setUpWhitelist, setupSite } from "tests/integration/helpers/seed"
import { db } from "~/server/modules/database"
import { TEST_EMAILS } from "~e2e/fixtures/auth"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

/** Idempotent user + sitewide permission. ON CONFLICT on
 *  (userId, siteId, resourceId, deletedAt). */
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
    // nomember must stay permissionless. Strip stray grants from prior runs.
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
      // Active row exists; update role to match.
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
  // tRPC auth checks email whitelist. Seed @open.gov.sg for all TEST_EMAILS users.
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
