import type { Resource } from "~/server/modules/database"
import { ISOMER_SUPPORT_EMAIL, ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { env } from "~/env.mjs"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

import { templates } from "../templates"

describe("invitationTemplate", () => {
  const mockData = {
    inviterName: "Test User",
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    role: RoleType.Admin,
  }

  it("should generate correct subject line", () => {
    const template = templates.invitation(mockData)
    expect(template.subject).toBe(
      `[Isomer Studio] Activate your account to edit Isomer sites`,
    )
  })

  it("should generate correct body content for Admin role", () => {
    const template = templates.invitation(mockData)
    expect(template.body).toContain("Hi test@example.com")
    expect(template.body).toContain("Test Site")
    expect(template.body).toContain("as Admin")
    expect(template.body).toContain(
      "edit and publish the content, as well as manage users and site settings",
    )
    if (env.NEXT_PUBLIC_APP_URL) {
      expect(template.body).toContain(env.NEXT_PUBLIC_APP_URL)
    }
  })

  it("should generate correct body content for Publisher role", () => {
    const template = templates.invitation({
      ...mockData,
      role: RoleType.Publisher,
    })
    expect(template.body).toContain("as Publisher")
    expect(template.body).toContain("edit and publish content")
  })

  it("should generate correct body content for Editor role", () => {
    const template = templates.invitation({
      ...mockData,
      role: RoleType.Editor,
    })
    expect(template.body).toContain("as Editor")
    expect(template.body).toContain("edit content")
  })

  it("should throw error for invalid role", () => {
    expect(() =>
      templates.invitation({
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
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Account deactivation warning - 7 days remaining",
    )
  })

  it("should generate correct subject line with different days remaining", () => {
    // Arrange
    const template = templates.accountDeactivationWarning({
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
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.body).toContain("Hi test@example.com")
  })

  it("should include login reminder with correct days", () => {
    // Arrange
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.body).toContain("please log in within the next 7 days")
    if (env.NEXT_PUBLIC_APP_URL) {
      expect(template.body).toContain(env.NEXT_PUBLIC_APP_URL)
    }
  })

  it("should include security measure message", () => {
    // Arrange
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.body).toContain(
      "This is a standard security measure to protect your sites and data.",
    )
  })

  it("should include site access loss warning", () => {
    // Arrange
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.body).toContain(
      "If your account becomes deactivated, you will lose access to the following sites:",
    )
  })

  it("should include single site name in list", () => {
    // Arrange
    const template = templates.accountDeactivationWarning(mockData)

    // Assert
    expect(template.body).toContain("<li>Test Site 1</li>")
  })

  it("should include multiple site names in list", () => {
    // Arrange
    const template = templates.accountDeactivationWarning({
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
    const template = templates.accountDeactivationWarning(mockData)

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
    const template = templates.accountDeactivation(mockData)

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Your account has been deactivated due to inactivity",
    )
  })

  it("should generate correct body content with recipient email", () => {
    // Arrange
    const template = templates.accountDeactivation(mockData)

    // Assert
    expect(template.body).toContain("Hi test@example.com")
  })

  it("should include inactivity message with correct days", () => {
    // Arrange
    const template = templates.accountDeactivation(mockData)

    // Assert
    expect(template.body).toContain(
      "Your Isomer Studio account has been removed as you have not logged in for over 90 days.",
    )
  })

  it("should include reason for deactivation", () => {
    // Arrange
    const template = templates.accountDeactivation(mockData)

    // Assert
    expect(template.body).toContain(
      "This is a standard security measure to protect your site data.",
    )
  })

  it("should include content preservation and site accessibility reassurance message", () => {
    // Arrange
    const template = templates.accountDeactivation(mockData)

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
    const template = templates.accountDeactivation(mockData)

    // Assert
    expect(template.body).toContain(
      "To regain access to your site(s), please follow the instructions below",
    )
  })

  it("should include site name and admin emails in instructions when admins exist", () => {
    // Arrange
    const template = templates.accountDeactivation({
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
    const template = templates.accountDeactivation({
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
    const template = templates.accountDeactivation({
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
    const template = templates.accountDeactivation({
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

describe("email template HTML escaping", () => {
  const maliciousPayload = `</p><h1>URGENT</h1><a href='https://evil.tld?a=1&b=2'>Click "verify"</a><p>`
  const escapedPayload = `&lt;/p&gt;&lt;h1&gt;URGENT&lt;/h1&gt;&lt;a href=&#39;https://evil.tld?a=1&amp;b=2&#39;&gt;Click &quot;verify&quot;&lt;/a&gt;&lt;p&gt;`

  const mockResource = {
    id: "resource-id",
    title: "Test Page",
    permalink: "test-page",
    siteId: 1,
    parentId: null,
    publishedVersionId: null,
    draftBlobId: null,
    state: null,
    type: ResourceType.Page,
    scheduledAt: null,
    scheduledBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies Resource

  it("escapes invitation text fields", () => {
    // Arrange
    const templateData = {
      inviterName: maliciousPayload,
      recipientEmail: "recipient@example.com",
      siteName: maliciousPayload,
      role: RoleType.Admin,
    }

    // Act
    const template = templates.invitation(templateData)

    // Assert
    expect(template.body).toContain(escapedPayload)
    expect(template.body).not.toContain("<h1>URGENT</h1>")
    expect(template.body).not.toContain("https://evil.tld?a=1&b=2")
  })

  it("escapes resource titles and site names in publish alerts", () => {
    // Arrange
    const templateData = {
      recipientEmail: "publisher@example.com",
      siteName: maliciousPayload,
      resource: {
        ...mockResource,
        title: maliciousPayload,
      },
    }

    // Act
    const template = templates.publishAlertContentPublisher(templateData)

    // Assert
    expect(template.body).toContain(
      `published "${escapedPayload}" on ${escapedPayload}`,
    )
    expect(template.body).not.toContain("<h1>URGENT</h1>")
    expect(template.body).not.toContain("https://evil.tld?a=1&b=2")
  })

  it("keeps the resource title unescaped in publish alert subjects", () => {
    // Arrange
    const templateData = {
      recipientEmail: "publisher@example.com",
      publisherEmail: "publisher@example.com",
      siteName: "Test Site",
      resource: {
        ...mockResource,
        title: "R&D Report",
      },
    }

    // Act
    const contentPublisherTemplate =
      templates.publishAlertContentPublisher(templateData)
    const siteAdminTemplate = templates.publishAlertSiteAdmin(templateData)

    // Assert
    expect(contentPublisherTemplate.subject).toBe(
      "[Isomer Studio] R&D Report has been published",
    )
    expect(siteAdminTemplate.subject).toBe(
      "[Isomer Studio] R&D Report has been published",
    )
  })

  it("escapes site names in account deactivation warnings", () => {
    // Arrange
    const templateData = {
      recipientEmail: "recipient@example.com",
      siteNames: [maliciousPayload],
      inHowManyDays: 7 as const,
    }

    // Act
    const template = templates.accountDeactivationWarning(templateData)

    // Assert
    expect(template.body).toContain(`<li>${escapedPayload}</li>`)
    expect(template.body).not.toContain("<h1>URGENT</h1>")
    expect(template.body).not.toContain("https://evil.tld?a=1&b=2")
  })

  it("escapes site names and admin emails in account deactivation emails", () => {
    // Arrange
    const templateData = {
      recipientEmail: "recipient@example.com",
      sitesAndAdmins: [
        {
          siteName: maliciousPayload,
          adminEmails: [maliciousPayload],
        },
      ],
    }

    // Act
    const template = templates.accountDeactivation(templateData)

    // Assert
    expect(template.body).toContain(`<p><b>${escapedPayload}</b></p>`)
    expect(template.body).toContain(`<li>${escapedPayload}</li>`)
    expect(template.body).not.toContain("<h1>URGENT</h1>")
    expect(template.body).not.toContain("https://evil.tld?a=1&b=2")
  })
})
