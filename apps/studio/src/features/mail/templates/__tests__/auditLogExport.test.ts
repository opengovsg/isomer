import { describe, expect, it } from "vitest"

import { templates } from "../templates"

describe("auditLogExportReady template", () => {
  const baseData = {
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    month: "June 2026",
  }

  it("includes both labels and URLs as hrefs for a two-link export", () => {
    // Arrange
    const data = {
      ...baseData,
      links: [
        { label: "Access report", url: "https://s3.example/access?sig=abc" },
        {
          label: "Activity report",
          url: "https://s3.example/activity?sig=def",
        },
      ],
    }

    // Act
    const template = templates.auditLogExportReady(data)

    // Assert: both labels and both signed URLs rendered as anchors
    expect(template.body).toContain(
      `<a href="https://s3.example/access?sig=abc">Access report</a>`,
    )
    expect(template.body).toContain(
      `<a href="https://s3.example/activity?sig=def">Activity report</a>`,
    )
  })

  it("renders only one href for a single-link export", () => {
    // Arrange
    const data = {
      ...baseData,
      links: [{ label: "Access report", url: "https://s3.example/only?sig=1" }],
    }

    // Act
    const template = templates.auditLogExportReady(data)

    // Assert
    const hrefCount = (
      template.body.match(/<a href="https:\/\/s3\.example/g) ?? []
    ).length
    expect(hrefCount).toBe(1)
    expect(template.body).toContain(
      `<a href="https://s3.example/only?sig=1">Access report</a>`,
    )
  })

  it("puts the site name and month in the subject", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      links: [{ label: "Access report", url: "https://s3.example/x" }],
    })

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Your audit log export for Test Site (June 2026) is ready",
    )
  })

  it("includes the 3-day validity note", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      links: [{ label: "Access report", url: "https://s3.example/x" }],
    })

    // Assert
    expect(template.body).toContain("valid for 3 days")
  })

  it("escapes HTML in the site name and link labels", () => {
    // Arrange
    const data = {
      ...baseData,
      siteName: `Evil <b>&</b> Co`,
      links: [{ label: `Report <script>&`, url: "https://s3.example/x" }],
    }

    // Act
    const template = templates.auditLogExportReady(data)

    // Assert: special chars escaped, no raw injection
    expect(template.subject).toContain("Evil &lt;b&gt;&amp;&lt;/b&gt; Co")
    expect(template.body).toContain("Evil &lt;b&gt;&amp;&lt;/b&gt; Co")
    expect(template.body).toContain("Report &lt;script&gt;&amp;")
    expect(template.body).not.toContain("<b>&</b>")
    expect(template.body).not.toContain("<script>")
  })
})

describe("auditLogExportFailed template", () => {
  const data = {
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    month: "June 2026",
  }

  it("has a sane subject mentioning failure to generate", () => {
    // Act
    const template = templates.auditLogExportFailed(data)

    // Assert
    expect(template.subject).toBe(
      "[Isomer Studio] Your audit log export for Test Site (June 2026) could not be generated",
    )
  })

  it("apologises and points to support in the body", () => {
    // Act
    const template = templates.auditLogExportFailed(data)

    // Assert
    expect(template.body).toContain("Hi test@example.com")
    expect(template.body).toContain("couldn't generate")
    expect(template.body).toContain("support@isomer.gov.sg")
  })

  it("escapes HTML in the site name", () => {
    // Act
    const template = templates.auditLogExportFailed({
      ...data,
      siteName: `Evil <b>&</b> Co`,
    })

    // Assert
    expect(template.subject).toContain("Evil &lt;b&gt;&amp;&lt;/b&gt; Co")
    expect(template.body).not.toContain("<b>&</b>")
  })
})
