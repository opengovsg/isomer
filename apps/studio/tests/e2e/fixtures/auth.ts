import path from "path"
import { fileURLToPath } from "url"

export const ROLES = [
  "editor",
  "publisher",
  "admin",
  "nomember",
  "core",
  "migrator",
] as const
export type Role = (typeof ROLES)[number]

export const TEST_EMAILS: Record<Role, string> = {
  editor: "editor@open.gov.sg",
  publisher: "publisher@open.gov.sg",
  admin: "admin-e2e@open.gov.sg",
  nomember: "nomember-e2e@open.gov.sg",
  core: "core-e2e@open.gov.sg",
  migrator: "migrator-e2e@open.gov.sg",
}

/** Playwright tag for a role project (`grep: /@admin\b/`). Typed so typos fail at compile time. */
export const roleTag = <R extends Role>(role: R): `@${R}` => `@${role}`

const STORAGE_DIR = fileURLToPath(new URL("../storage-state", import.meta.url))

export const storageStateFor = (role: Role): string =>
  path.join(STORAGE_DIR, `${role}.json`)
