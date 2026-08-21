import { db } from "~/server/modules/database"

const E2E_USER_NAME = "test-e2e"
const E2E_USER_PHONE = "82345678"

/** Skip the welcome modal by ensuring name + phone are set on the user. */
export const ensureUserOnboarded = (email: string) =>
  db
    .updateTable("User")
    .set({ name: E2E_USER_NAME, phone: E2E_USER_PHONE })
    .where("email", "=", email)
    .execute()
