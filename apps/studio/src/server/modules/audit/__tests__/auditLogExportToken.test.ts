import { sealData } from "iron-session"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The token module seals/unseals with the shared iron password map, which is
// derived from env.SESSION_SECRET (see modules/auth/session.ts). Pin a fixed
// secret so the roundtrip and the cross-purpose-confusion case are
// deterministic and independent of the real environment. The literal is
// repeated inside the vi.mock factory below because that factory is hoisted
// above all top-level bindings and cannot close over this const.
const SESSION_SECRET = "test-session-secret-at-least-32-chars-long"

vi.mock("~/env.mjs", () => ({
  env: {
    SESSION_SECRET: "test-session-secret-at-least-32-chars-long",
  },
}))

import {
  sealAuditLogExportToken,
  unsealAuditLogExportToken,
} from "../auditLogExportToken"

// The password map used everywhere (sessions AND export tokens). Sealing a
// session-shaped blob with this same map is what the confusion test needs to
// prove is rejected on the export side.
const IRON_PASSWORD = { "1": SESSION_SECRET }

describe("auditLogExportToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("roundtrips: unseal returns the exact requestId that was sealed", async () => {
    const token = await sealAuditLogExportToken("12345")
    expect(token).toBeTypeOf("string")
    expect(token.length).toBeGreaterThan(0)

    const requestId = await unsealAuditLogExportToken(token)
    expect(requestId).toBe("12345")
  })

  it("rejects garbage that is not an iron seal at all", async () => {
    expect(await unsealAuditLogExportToken("")).toBeNull()
    expect(await unsealAuditLogExportToken("not-a-real-token")).toBeNull()
    expect(
      await unsealAuditLogExportToken("Fe26.2**deadbeef**garbage"),
    ).toBeNull()
  })

  it("rejects a blob sealed with a DIFFERENT secret (forged/tampered)", async () => {
    const foreignToken = await sealData(
      { purpose: "audit-log-export", requestId: "12345" },
      { password: { "1": "some-other-secret-at-least-32-chars-longX" } },
    )
    expect(await unsealAuditLogExportToken(foreignToken)).toBeNull()
  })

  it("rejects a well-sealed blob whose purpose is wrong", async () => {
    // Sealed with the CORRECT key, so it unseals cleanly — but the purpose
    // discriminator does not match, so it must be refused.
    const wrongPurpose = await sealData(
      { purpose: "something-else", requestId: "12345" },
      { password: IRON_PASSWORD },
    )
    expect(await unsealAuditLogExportToken(wrongPurpose)).toBeNull()
  })

  it("rejects a session-shaped blob sealed with the SAME key (cross-purpose confusion)", async () => {
    // This is the load-bearing case: session cookies are sealed with the same
    // password map as export tokens (getIronPassword). A session blob has no
    // `purpose` field, so the strict purpose check must reject it — a leaked
    // or misrouted session cookie can never be redeemed as a download link.
    const sessionBlob = await sealData(
      { userId: "some-user-id" },
      { password: IRON_PASSWORD },
    )
    expect(await unsealAuditLogExportToken(sessionBlob)).toBeNull()
  })

  it("rejects a correctly-purposed blob whose requestId is not a positive integer string", async () => {
    for (const requestId of ["", "abc", "-1", "1.5", "12a", "0x10", " 5 "]) {
      const token = await sealData(
        { purpose: "audit-log-export", requestId },
        { password: IRON_PASSWORD },
      )
      expect(await unsealAuditLogExportToken(token)).toBeNull()
    }
  })

  it("rejects a correctly-purposed blob whose requestId is a number, not a string", async () => {
    const token = await sealData(
      { purpose: "audit-log-export", requestId: 12345 },
      { password: IRON_PASSWORD },
    )
    expect(await unsealAuditLogExportToken(token)).toBeNull()
  })
})
