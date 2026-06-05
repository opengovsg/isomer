import path from "path"

export const ROLES = ["editor", "publisher", "admin", "nomember"] as const
export type Role = (typeof ROLES)[number]

export const TEST_EMAILS: Record<Role, string> = {
  editor: "editor@open.gov.sg",
  publisher: "publisher@open.gov.sg",
  admin: "admin-e2e@open.gov.sg",
  nomember: "nomember-e2e@open.gov.sg",
}

const STORAGE_DIR = path.join(__dirname, "..", "storage-state")

export const storageStateFor = (role: Role): string =>
  path.join(STORAGE_DIR, `${role}.json`)
