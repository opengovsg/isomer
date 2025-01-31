import { ISOMER_ADMINS, ISOMER_MIGRATORS } from "~prisma/constants"

import { isIsomerAdmin } from "../useIsIsomerAdmin"

describe("isIsomerAdmin", () => {
  it("should return true for an Isomer admin user", () => {
    const adminEmail = `${ISOMER_ADMINS[0]}@open.gov.sg`
    expect(isIsomerAdmin(adminEmail)).toBe(true)
  })

  it("should return true for an Isomer migrator user", () => {
    const migratorEmail = `${ISOMER_MIGRATORS[0]}@open.gov.sg`
    expect(isIsomerAdmin(migratorEmail)).toBe(true)
  })

  it("should return false for non-admin open.gov.sg user", () => {
    expect(isIsomerAdmin("regular.user@open.gov.sg")).toBe(false)
  })

  it("should return false for non-open.gov.sg user", () => {
    expect(isIsomerAdmin("user@example.com")).toBe(false)
  })

  it("should handle empty email gracefully", () => {
    expect(isIsomerAdmin("")).toBe(false)
  })

  it("should handle email without domain gracefully", () => {
    expect(isIsomerAdmin("username")).toBe(false)
  })
})
