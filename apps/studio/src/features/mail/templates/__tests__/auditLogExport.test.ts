import { describe, expect, it } from "vitest"

import { templates } from "../templates"

describe("auditLogExportReady template", () => {
  const baseData = {
    recipientEmail: "test@example.com",
    siteName: "Test Site",
    month: "June 2026",
    // 2.5 MB with ONE_MB_IN_BYTES = 1_000_000, so the label reads "2.5 MB".
    sizeInBytes: 2_500_000,
    expiresAt: "22/09/2026, 11:59pm (SGT)",
  }

  it("maps the access label to its display text and keeps its signed URL", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/access?sig=abc" },
    })

    // Assert: the label renders its mapped text against its own signed URL
    expect(template.body).toContain(
      `<a href="https://s3.example/access?sig=abc">Download access review logs for June 2026 [.csv, 2.5 MB]</a>`,
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
      `<a href="https://s3.example/audit?sig=def">Download audit review logs for June 2026 [.csv, 2.5 MB]</a>`,
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
      `<a href="https://s3.example/only?sig=1">Download access review logs for June 2026 [.csv, 2.5 MB]</a>`,
    )
  })

  it("renders a placeholder size when sizeInBytes is unknown", () => {
    // Act: the reuse path can deliver an artifact whose size was never
    // measured — the template must not render "NaN" or crash.
    const template = templates.auditLogExportReady({
      ...baseData,
      sizeInBytes: null,
      link: { label: "access", url: "https://s3.example/nosize" },
    })

    // Assert
    expect(template.body).toContain("[.csv, unknown size]")
    expect(template.body).not.toContain("NaN")
  })

  it("renders a real 0-byte export as a size, not the unknown-size placeholder", () => {
    // Act: a genuinely empty (but successfully generated) CSV must be
    // distinguishable from a failed size lookup — see formatExportSize.
    const template = templates.auditLogExportReady({
      ...baseData,
      sizeInBytes: 0,
      link: { label: "access", url: "https://s3.example/empty" },
    })

    // Assert
    expect(template.body).toContain("[.csv, 0 KB]")
    expect(template.body).not.toContain("unknown size")
  })

  it("renders sub-megabyte sizes in KB instead of a rounded-away 0.00MB/0.01MB", () => {
    // Act: 14 KB previously rendered as the misleading "0.01MB".
    const template = templates.auditLogExportReady({
      ...baseData,
      sizeInBytes: 14_000,
      link: { label: "access", url: "https://s3.example/small" },
    })

    // Assert
    expect(template.body).toContain("[.csv, 14 KB]")
  })

  it("uses an access-logs subject for an access report", () => {
    // Act
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert
    expect(template.subject).toBe(
      "[Isomer] Access logs for June 2026 for your site (Test Site) is ready",
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
      "[Isomer] Audit logs for June 2026 for your site (Test Site) is ready",
    )
  })

  it("states an absolute expiry instant instead of a relative day count", () => {
    // Act: a relative "expires in 3 days" has no fixed anchor the recipient
    // can see — dogfooding feedback asked for an absolute date/time/timezone.
    const template = templates.auditLogExportReady({
      ...baseData,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert
    expect(template.body).toContain("expire on 22/09/2026, 11:59pm (SGT)")
    expect(template.body).not.toContain("days")
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

  it("keeps the site name unescaped in the subject", () => {
    // Act: the site name is interpolated into the subject, which isn't HTML
    const template = templates.auditLogExportReady({
      ...baseData,
      siteName: `Evil <b>&</b> Co`,
      link: { label: "access", url: "https://s3.example/x" },
    })

    // Assert: the raw site name renders as-is; escaped entities never leak in
    expect(template.subject).toContain("Evil <b>&</b> Co")
    expect(template.subject).not.toContain("&lt;b&gt;&amp;&lt;/b&gt;")
  })

  it("escapes a multi-parameter signed URL exactly once", () => {
    // Act: SigV4 URLs carry several &-separated query params. Escaping twice
    // renders &amp;amp;, which an email client decodes back to a query string
    // S3 never signed — the download link 404s.
    const template = templates.auditLogExportReady({
      ...baseData,
      link: {
        label: "access",
        url: "https://s3.example/k?X-Amz-Signature=abc&X-Amz-Expires=259200",
      },
    })

    // Assert: single-escaped ampersand in the href, never a double escape
    expect(template.body).toContain(
      `<a href="https://s3.example/k?X-Amz-Signature=abc&amp;X-Amz-Expires=259200">`,
    )
    expect(template.body).not.toContain("&amp;amp;")
  })
})

describe("auditLogExportBatchReady template", () => {
  const baseData = {
    recipientEmail: "test@example.com",
    month: "June 2026",
    reportLabel: "access" as const,
    failedSiteNames: [],
  }

  const expiresAt = "22/09/2026, 11:59pm (SGT)"

  it("formats each link's size independently, distinguishing 0 bytes from an unknown size", () => {
    // Act
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "Big Site",
          url: "https://s3.example/big",
          sizeInBytes: 2_500_000,
          expiresAt,
        },
        {
          siteName: "Small Site",
          url: "https://s3.example/small",
          sizeInBytes: 14_000,
          expiresAt,
        },
        {
          siteName: "Empty Site",
          url: "https://s3.example/empty",
          sizeInBytes: 0,
          expiresAt,
        },
        {
          siteName: "Unmeasured Site",
          url: "https://s3.example/unknown",
          sizeInBytes: null,
          expiresAt,
        },
      ],
    })

    // Assert
    expect(template.body).toContain("(2.5 MB)")
    expect(template.body).toContain("(14 KB)")
    expect(template.body).toContain("(0 KB)")
    expect(template.body).toContain("(unknown size)")
  })

  it("uses the site name as the link text instead of a repeated download label", () => {
    // Act
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "Hack for Public Good",
          url: "https://s3.example/hfpg",
          sizeInBytes: 14_000,
          expiresAt,
        },
      ],
    })

    // Assert
    expect(template.body).toContain(
      `<a href="https://s3.example/hfpg">Hack for Public Good</a> (14 KB)`,
    )
  })

  it("renders the link list as a numbered list so long batches are trackable", () => {
    // Act
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "A Site",
          url: "https://s3.example/a",
          sizeInBytes: 100,
          expiresAt,
        },
      ],
    })

    // Assert
    expect(template.body).toContain("<ol>")
    expect(template.body).not.toContain("<ul><li>")
  })

  it("states a single absolute expiry once when every link shares one", () => {
    // Act
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "A",
          url: "https://s3.example/a",
          sizeInBytes: 100,
          expiresAt,
        },
        {
          siteName: "B",
          url: "https://s3.example/b",
          sizeInBytes: 200,
          expiresAt,
        },
      ],
    })

    // Assert: one blanket sentence, not repeated per link.
    expect(template.body).toContain(
      `Each link below will expire on ${expiresAt}.`,
    )
    expect(template.body).not.toContain("expires 22/09/2026")
  })

  it("states each link's own expiry when they differ across the batch", () => {
    // Act: sibling sites can complete (and so expire) at different instants.
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "A",
          url: "https://s3.example/a",
          sizeInBytes: 100,
          expiresAt: "22/09/2026, 11:59pm (SGT)",
        },
        {
          siteName: "B",
          url: "https://s3.example/b",
          sizeInBytes: 200,
          expiresAt: "23/09/2026, 09:00am (SGT)",
        },
      ],
    })

    // Assert
    expect(template.body).toContain(
      "(0.1 KB, expires 22/09/2026, 11:59pm (SGT))",
    )
    expect(template.body).toContain(
      "(0.2 KB, expires 23/09/2026, 09:00am (SGT))",
    )
    expect(template.body).not.toContain("Each link below will expire on")
  })

  it("tells the requester how many of the requested sites succeeded", () => {
    // Act
    const template = templates.auditLogExportBatchReady({
      ...baseData,
      links: [
        {
          siteName: "A",
          url: "https://s3.example/a",
          sizeInBytes: 100,
          expiresAt,
        },
      ],
      failedSiteNames: ["Broken Site"],
    })

    // Assert
    expect(template.body).toContain("1 of 2 site(s) succeeded")
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

  it("keeps the site name unescaped in the subject but escapes it in the body", () => {
    // Act
    const template = templates.auditLogExportFailed({
      ...data,
      siteName: `Evil <b>&</b> Co`,
    })

    // Assert: the subject isn't HTML, so the raw site name renders as-is;
    // the body is HTML, so it stays escaped there.
    expect(template.subject).toContain("Evil <b>&</b> Co")
    expect(template.body).not.toContain("<b>&</b>")
  })
})
