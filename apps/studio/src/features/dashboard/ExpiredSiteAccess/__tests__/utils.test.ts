import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"

import {
  buildExpiredSiteSupportMailto,
  formatAdminDisplayName,
  getAdminInitials,
} from "../utils"

describe("formatAdminDisplayName", () => {
  it("title-cases dot-separated local parts", () => {
    // Arrange / Act / Assert
    expect(formatAdminDisplayName("alpha.admin@mti.gov.sg")).toBe("Alpha Admin")
  })

  it("title-cases underscore- and hyphen-separated local parts", () => {
    // Arrange / Act / Assert
    expect(formatAdminDisplayName("zebra_admin@example.gov.sg")).toBe(
      "Zebra Admin",
    )
    expect(formatAdminDisplayName("john-doe@corp.gov.sg")).toBe("John Doe")
  })
})

describe("getAdminInitials", () => {
  it("uses the first character of the first two name segments", () => {
    // Arrange / Act / Assert
    expect(getAdminInitials("alpha.admin@mti.gov.sg")).toBe("AA")
  })

  it("uses the first two characters of a single-segment local part", () => {
    // Arrange / Act / Assert
    expect(getAdminInitials("admin@agency.gov.sg")).toBe("AD")
  })
})

describe("buildExpiredSiteSupportMailto", () => {
  it("builds a mailto link with encoded subject and body", () => {
    // Arrange
    const siteName = "ACME Gov"
    const loginEmail = "johndoe@corp.gov.sg"

    // Act
    const href = buildExpiredSiteSupportMailto({ siteName, loginEmail })
    const [mailto, queryString] = href.split("?")
    const params = new URLSearchParams(queryString)

    // Assert
    expect(mailto).toBe(`mailto:${ISOMER_SUPPORT_EMAIL}`)
    expect(params.get("subject")).toBe(`Request access back to ${siteName}`)
    expect(params.get("body")).toBe(
      [
        "Hi Isomer team,",
        "",
        `My access to ${siteName} has expired. Please help me get access back.`,
        "",
        `Site: ${siteName}`,
        `Login email: ${loginEmail}`,
        "",
        "Thank you.",
      ].join("\n"),
    )
  })
})
