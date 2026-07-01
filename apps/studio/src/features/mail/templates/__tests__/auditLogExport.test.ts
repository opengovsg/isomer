import { describe, expect, it } from "vitest"

import { templates } from "../templates"

describe("auditLogExportReady template", () => {
  const baseData = {
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    month: "June 2026",
  }

  it("maps the access label to its display text and keeps its signed URL", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/access?sig=abc" },
    })

    // Assert: the label renders its mapped text against its own signed URL
    expect(template.body).toContain(
      `<a href="https://s3.example/access?sig=abc">Download access review [.csv]</a>`,
    )
  })

  it("maps the audit label to its display text and keeps its signed URL", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "audit", url: "https://s3.example/audit?sig=def" },
    })

    // Assert: the label renders its mapped text against its own signed URL
    expect(template.body).toContain(
      `<a href="https://s3.example/audit?sig=def">Download audit logs [.csv]</a>`,
    )
  })

  it("renders exactly one download link", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/only?sig=1" },
    })

    // Assert
    const hrefCount = (
      template.body.match(/<a href="https:\/\/s3\.example/g) ?? []
    ).length
    expect(hrefCount).toBe(1)
    expect(template.body).toContain(
      `<a href="https://s3.example/only?sig=1">Download access review [.csv]</a>`,
    )
  })

  it("uses an access-logs subject for an access report", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert
    expect(template.subject).toBe(
      "[Isomer] Access logs for Test Site (June 2026) is ready",
    )
  })

  it("uses an audit-logs subject for an audit report", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "audit", url: "https://s3.example/a" },
    })

    // Assert
    expect(template.subject).toBe(
      "[Isomer] Audit logs for Test Site (June 2026) is ready",
    )
  })

  it("notes that the link expires after 3 days", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert
    expect(template.body).toContain("expire after 3 days")
  })

  it("escapes special chars in the link href so it can't break out of the attribute", () => {
    // Act: a URL crafted to break out of the href attribute and inject markup
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: `https://s3.example/x?a="><script>` },
    })

    // Assert: the raw injection payload never appears; the escaped form does
    expect(template.body).not.toContain(`"><script>`)
    expect(template.body).toContain(
      `<a href="https://s3.example/x?a=&quot;&gt;&lt;script&gt;">`,
    )
  })

  it("escapes HTML in the site name", () => {
    // Act: the site name is interpolated into the subject
    const template = templates.auditLogExportReady({
      ...baseData,
      siteName: `Evil <b>&</b> Co`,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert: special chars escaped, no raw injection
    expect(template.subject).toContain("Evil &lt;b&gt;&amp;&lt;/b&gt; Co")
    expect(template.subject).not.toContain("<b>&</b>")
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
