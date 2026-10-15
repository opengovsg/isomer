import { describe, expect, it } from "vitest"

import { setSiteConfigByAdminSchema } from "../site"

describe("admin site theme selection", () => {
  const configSchema = setSiteConfigByAdminSchema.shape.config

  it("accepts a publishable theme without changing the site configuration", () => {
    const config = JSON.stringify({ theme: "isomer-next", siteName: "My site" })
    expect(configSchema.parse(config)).toBe(config)
  })

  it("rejects malformed configuration, unknown themes and development references", () => {
    for (const config of [
      "invalid JSON",
      "null",
      "[]",
      "{}",
      JSON.stringify({ theme: null }),
      JSON.stringify({ theme: "typo" }),
      JSON.stringify({ theme: "isomer-classic" }),
    ]) {
      expect(configSchema.safeParse(config).success).toBe(false)
    }
  })
})
