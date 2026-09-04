import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

import {
  AgencySettingsSchema,
  SITE_ENTITY_TYPES,
  SiteEntitySettingsSchema,
} from "../site"

describe(SiteEntitySettingsSchema, () => {
  // NOTE: `Value.Check` ignores the `enum` keyword, so asserting on the emitted
  // schema is the only guard here that the allowed types reach consumers. Ajv
  // (in Studio) is what actually enforces it at runtime.
  it("limits the organisation-type field to the supported values", () => {
    expect(SiteEntitySettingsSchema.properties.type).toMatchObject({
      type: "string",
      enum: SITE_ENTITY_TYPES,
    })
  })

  it("accepts structured address and contact-point metadata", () => {
    expect(
      Value.Check(SiteEntitySettingsSchema, {
        type: "GovernmentOrganization",
        address: {
          streetAddress: "1 Example Street",
          addressLocality: "Singapore",
          postalCode: "123456",
          addressCountry: "SG",
        },
        contactPoint: {
          contactType: "Customer service",
          telephone: "+65 6123 4567",
          email: "hello@example.gov.sg",
        },
      }),
    ).toBeTruthy()
  })

  it.each(["S", "SGP", "S1", "  "])(
    "rejects %s as a country code",
    (addressCountry) => {
      expect(
        Value.Check(SiteEntitySettingsSchema, { address: { addressCountry } }),
      ).toBeFalsy()
    },
  )

  it("allows the organisation type to be derived at render time", () => {
    expect(Value.Check(SiteEntitySettingsSchema, {})).toBeTruthy()
  })

  it("keeps site entity metadata optional for existing settings", () => {
    expect(
      Value.Check(AgencySettingsSchema, { siteName: "Existing site" }),
    ).toBeTruthy()
  })
})
