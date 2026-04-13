import { describe, expect, it } from "vitest"
import {
  FAVICON_ACCEPTED_MIME_TYPE_MAPPING,
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
} from "~/constants/image"

import { LogoSettingsSchema } from "../site"

describe("LogoSettingsSchema", () => {
  it("uses the expected favicon mime types in UI order", () => {
    expect(Object.keys(FAVICON_ACCEPTED_MIME_TYPE_MAPPING)).toEqual([
      ".png",
      ".svg",
      ".jpg",
      ".jpeg",
      ".webp",
    ])

    expect(FAVICON_ACCEPTED_MIME_TYPE_MAPPING).toEqual({
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    })
  })

  it("applies favicon-specific upload restrictions to favicon field", () => {
    const faviconSchema = LogoSettingsSchema.properties.favicon

    expect(faviconSchema).toBeDefined()
    expect(faviconSchema.type).toBe("string")
    expect(faviconSchema.format).toBe("image")
    expect(faviconSchema.allowedMimeTypeMappings).toEqual(
      FAVICON_ACCEPTED_MIME_TYPE_MAPPING,
    )
    expect(faviconSchema.maxSizeInBytes).toBe(20_000)
  })

  it("keeps logo uploads on the broader default image mapping", () => {
    const logoUrlSchema = LogoSettingsSchema.properties.logoUrl

    expect(logoUrlSchema.allowedMimeTypeMappings).toEqual(
      IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
    )
    expect(logoUrlSchema.allowedMimeTypeMappings[".gif"]).toBe("image/gif")
    expect(logoUrlSchema.maxSizeInBytes).toBeUndefined()
  })
})
