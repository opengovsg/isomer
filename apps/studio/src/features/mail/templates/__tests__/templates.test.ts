import { RoleType } from "~prisma/generated/generatedEnums"

import { env } from "~/env.mjs"
import { invitationTemplate } from "../templates"

describe("invitationTemplate", () => {
  const mockData = {
    inviterName: "Test User",
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    role: RoleType.Admin,
  }

  it("should generate correct subject line", () => {
    const template = invitationTemplate(mockData)
    expect(template.subject).toBe(
      `[Isomer Studio] Activate your account to edit Isomer sites`,
    )
  })

  it("should generate correct body content for Admin role", () => {
    const template = invitationTemplate(mockData)
    expect(template.body).toContain("Hi test@example.com")
    expect(template.body).toContain("Test Site")
    expect(template.body).toContain("as Admin")
    expect(template.body).toContain(
      "edit and publish the content, as well as manage users and site settings",
    )
    expect(template.body).toContain(env.NEXT_PUBLIC_APP_URL)
  })

  it("should generate correct body content for Publisher role", () => {
    const template = invitationTemplate({
      ...mockData,
      role: RoleType.Publisher,
    })
    expect(template.body).toContain("as Publisher")
    expect(template.body).toContain("edit and publish content")
  })

  it("should generate correct body content for Editor role", () => {
    const template = invitationTemplate({
      ...mockData,
      role: RoleType.Editor,
    })
    expect(template.body).toContain("as Editor")
    expect(template.body).toContain("edit content")
  })

  it("should throw error for invalid role", () => {
    expect(() =>
      invitationTemplate({
        ...mockData,
        role: "InvalidRole" as RoleType,
      }),
    ).toThrow("Unknown role. Please check the role type.")
  })
})
