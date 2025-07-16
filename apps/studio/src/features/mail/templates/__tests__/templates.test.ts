import { RoleType } from "~prisma/generated/generatedEnums"

import { ISOMER_SUPPORT_EMAIL, ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { env } from "~/env.mjs"
import {
  accountDeactivationTemplate,
  accountDeactivationWarningTemplate,
  invitationTemplate,
} from "../templates"

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

describe("accountDeactivationWarningTemplate", () => {
  const mockData = {
    recipientEmail: "test@example.com",
    siteNames: ["Test Site 1"],
    inHowManyDays: 7 as const,
  }

  it("should generate correct subject line with days remaining", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Account deactivation warning - 7 days remaining",
    )
  })

  it("should generate correct subject line with different days remaining", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate({
      ...mockData,
      inHowManyDays: 14,
    })

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Account deactivation warning - 14 days remaining",
    )
  })

  it("should generate correct body content with recipient email", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain("Hi test@example.com")
  })

  it("should include login reminder with correct days", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain("please log in within the next 7 days")
    expect(template.body).toContain(env.NEXT_PUBLIC_APP_URL)
  })

  it("should include security measure message", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "This is a standard security measure to protect your sites and data.",
    )
  })

  it("should include site access loss warning", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "If your account becomes deactivated, you will lose access to the following sites:",
    )
  })

  it("should include single site name in list", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain("<li>Test Site 1</li>")
  })

  it("should include multiple site names in list", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate({
      ...mockData,
      siteNames: ["Site A", "Site B", "Site C"],
    })

    // Assert
    expect(template.body).toContain("<li>Site A</li>")
    expect(template.body).toContain("<li>Site B</li>")
    expect(template.body).toContain("<li>Site C</li>")
  })

  it("should include content preservation message", () => {
    // Arrange
    const template = accountDeactivationWarningTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "Your content will still be preserved, but you won’t be able to access or manage these sites unless your account is reactivated.",
    )
  })
})

describe("accountDeactivationTemplate", () => {
  const mockData = {
    recipientEmail: "test@example.com",
    sitesAndAdmins: [],
  }

  it("should generate correct subject line", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Your account has been deactivated due to inactivity",
    )
  })

  it("should generate correct body content with recipient email", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.body).toContain("Hi test@example.com")
  })

  it("should include inactivity message with correct days", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "Your Isomer Studio account has been removed as you have not logged in for over 90 days.",
    )
  })

  it("should include reason for deactivation", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "This is a standard security measure to protect your site data.",
    )
  })

  it("should include content preservation and site accessibility reassurance message", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "Your content and previous contributions have been preserved",
    )
    expect(template.body).toContain(
      "Your site(s) will continue to be accessible to visitors, and all your work remains intact.",
    )
  })

  it("should include instructions for regaining access", () => {
    // Arrange
    const template = accountDeactivationTemplate(mockData)

    // Assert
    expect(template.body).toContain(
      "To regain access to your site(s), please follow the instructions below",
    )
  })

  it("should include site name and admin emails in instructions when admins exist", () => {
    // Arrange
    const template = accountDeactivationTemplate({
      recipientEmail: "test@example.com",
      sitesAndAdmins: [
        {
          siteName: "Test Site 1",
          adminEmails: ["admin1@example.com", "admin2@example.com"],
        },
      ],
    })

    // Assert
    const expectedSiteInstructions = `<p><b>Test Site 1</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul><li>admin1@example.com</li><li>admin2@example.com</li></ul>
        `
    expect(template.body).toContain(expectedSiteInstructions)
  })

  it("should show support email message when no admins exist", () => {
    // Arrange
    const template = accountDeactivationTemplate({
      recipientEmail: "test@example.com",
      sitesAndAdmins: [
        {
          siteName: "Test Site 1",
          adminEmails: [],
        },
      ],
    })

    // Assert
    const expectedSiteInstructions = `<p><b>Test Site 1</b></p>
        <p>There are no administrators for this site. To be added back, please send an email to <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> with your line manager in CC for approval.</p>
      `
    expect(template.body).toContain(expectedSiteInstructions)
  })

  it("should handle multiple sites with admins", () => {
    // Arrange
    const template = accountDeactivationTemplate({
      recipientEmail: "test@example.com",
      sitesAndAdmins: [
        {
          siteName: "Site A",
          adminEmails: ["admin1@example.com"],
        },
        {
          siteName: "Site B",
          adminEmails: ["admin2@example.com", "admin3@example.com"],
        },
      ],
    })

    // Assert
    const expectedSiteInstructionForSiteA = `<p><b>Site A</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul><li>admin1@example.com</li></ul>
        `
    expect(template.body).toContain(expectedSiteInstructionForSiteA)

    const expectedSiteInstructionForSiteB = `<p><b>Site B</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul><li>admin2@example.com</li><li>admin3@example.com</li></ul>
        `
    expect(template.body).toContain(expectedSiteInstructionForSiteB)
  })

  it("should handle multiple sites with mixed admin scenarios", () => {
    // Arrange
    const template = accountDeactivationTemplate({
      recipientEmail: "test@example.com",
      sitesAndAdmins: [
        {
          siteName: "Site with one admin",
          adminEmails: ["admin@example.com"],
        },
        {
          siteName: "Site with two admins",
          adminEmails: ["admin1@example.com", "admin2@example.com"],
        },
        {
          siteName: "Site without Admins",
          adminEmails: [],
        },
      ],
    })

    // Assert
    const expectedSiteInstructionForSiteWithOneAdmin = `<p><b>Site with one admin</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul><li>admin@example.com</li></ul>
        `
    expect(template.body).toContain(expectedSiteInstructionForSiteWithOneAdmin)

    const expectedSiteInstructionForSiteWithTwoAdmins = `<p><b>Site with two admins</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul><li>admin1@example.com</li><li>admin2@example.com</li></ul>
        `
    expect(template.body).toContain(expectedSiteInstructionForSiteWithTwoAdmins)

    const expectedSiteInstructionForSiteWithoutAdmins = `<p><b>Site without Admins</b></p>
        <p>There are no administrators for this site. To be added back, please send an email to <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> with your line manager in CC for approval.</p>
      `
    expect(template.body).toContain(expectedSiteInstructionForSiteWithoutAdmins)
  })
})
