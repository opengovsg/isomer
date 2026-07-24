import { createId } from "@paralleldrive/cuid2"
import { setUpWhitelist } from "tests/integration/helpers/seed"
import { db } from "~/server/modules/database"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"

const ensureUser = async (email: string) => {
  return db
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
}

/**
 * Idempotent: inserts user if missing and removes all site permissions so the
 * account stays permissionless across runs.
 */
const ensureUserWithoutPermissions = async (email: string) => {
  const user = await ensureUser(email)

  await db
    .deleteFrom("ResourcePermission")
    .where("userId", "=", user.id)
    .execute()

  return user
}

const ensureGodModeAdmin = async (
  email: string,
  role: (typeof IsomerAdminRole)[keyof typeof IsomerAdminRole],
) => {
  const user = await ensureUserWithoutPermissions(email)

  await db
    .insertInto("IsomerAdmin")
    .values({ userId: user.id, role, expiry: null })
    .onConflict((oc) =>
      oc.columns(["userId", "role"]).doUpdateSet({ expiry: null }),
    )
    .execute()
}

/** Whitelist + canonical role users for Playwright storage-state sign-in. */
export const seedRolesForE2E = async () => {
  await setUpWhitelist({ email: "@open.gov.sg" })

  await ensureUser(TEST_EMAILS.admin)
  await ensureUserWithoutPermissions(TEST_EMAILS.nomember)
  await ensureUser(TEST_EMAILS.editor)
  await ensureUser(TEST_EMAILS.publisher)
  await ensureGodModeAdmin(TEST_EMAILS.core, IsomerAdminRole.Core)
  await ensureGodModeAdmin(TEST_EMAILS.migrator, IsomerAdminRole.Migrator)
}
