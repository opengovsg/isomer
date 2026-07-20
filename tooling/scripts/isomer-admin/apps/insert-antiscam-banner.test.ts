import { describe, expect, it } from "vitest"

import {
  ANTISCAM_BANNER_BLOCK,
  appendAntiscamBanner,
  describeDraftStep,
  describePublishedStep,
  getBucket,
  hasAntiscamBanner,
  isUsableBlobContent,
  normalizePublisherEmail,
  planResource,
  type RootPageRow,
} from "./insert-antiscam-banner"

const makeRow = (overrides: Partial<RootPageRow> = {}): RootPageRow => ({
  id: "1",
  title: "Home",
  siteId: 1,
  siteName: "Test Site",
  draftBlobId: null,
  publishedVersionId: null,
  draftContent: null,
  publishedContent: null,
  ...overrides,
})

describe("getBucket", () => {
  it("returns published-only when published but no draft", () => {
    const row = makeRow({ publishedVersionId: "10", draftBlobId: null })
    expect(getBucket(row)).toBe("published-only")
  })

  it("returns published-and-draft when both are set", () => {
    const row = makeRow({ publishedVersionId: "10", draftBlobId: "20" })
    expect(getBucket(row)).toBe("published-and-draft")
  })

  it("returns draft-only when only draft is set", () => {
    const row = makeRow({ publishedVersionId: null, draftBlobId: "20" })
    expect(getBucket(row)).toBe("draft-only")
  })

  it("returns none when neither is set", () => {
    const row = makeRow({ publishedVersionId: null, draftBlobId: null })
    expect(getBucket(row)).toBe("none")
  })
})

describe("isUsableBlobContent", () => {
  it("returns false for null", () => {
    expect(isUsableBlobContent(null)).toBe(false)
  })

  it("returns false for arrays", () => {
    expect(isUsableBlobContent([])).toBe(false)
  })

  it("returns false for double-encoded JSON strings", () => {
    expect(isUsableBlobContent('{"content":[]}')).toBe(false)
  })

  it("returns true for plain objects", () => {
    expect(isUsableBlobContent({ content: [] })).toBe(true)
    expect(isUsableBlobContent({ layout: "homepage" })).toBe(true)
  })
})

describe("hasAntiscamBanner", () => {
  it("returns false for null content", () => {
    expect(hasAntiscamBanner(null)).toBe(false)
  })

  it("returns false when content array is missing", () => {
    expect(hasAntiscamBanner({ layout: "content" })).toBe(false)
  })

  it("returns false when content is not an array", () => {
    expect(hasAntiscamBanner({ content: "not-an-array" as never })).toBe(false)
  })

  it("returns false when content array has no banner block", () => {
    expect(
      hasAntiscamBanner({
        content: [{ type: "paragraph" }, { type: "callout" }],
      }),
    ).toBe(false)
  })

  it("returns true when content array already has a banner block", () => {
    expect(
      hasAntiscamBanner({
        content: [{ type: "paragraph" }, { type: "antiscambanner" }],
      }),
    ).toBe(true)
  })
})

describe("appendAntiscamBanner", () => {
  it("appends the banner block to the end of an existing content array", () => {
    const result = appendAntiscamBanner({
      content: [{ type: "paragraph" }],
    })
    expect(result.content).toEqual([
      { type: "paragraph" },
      ANTISCAM_BANNER_BLOCK,
    ])
  })

  it("preserves other top-level fields (layout, meta, page)", () => {
    const result = appendAntiscamBanner({
      layout: "content",
      meta: { title: "Home" },
      page: { title: "Home" },
      content: [{ type: "paragraph" }],
    })
    expect(result.layout).toBe("content")
    expect(result.meta).toEqual({ title: "Home" })
    expect(result.page).toEqual({ title: "Home" })
  })

  it("treats a missing content array as empty", () => {
    const result = appendAntiscamBanner({ layout: "content" })
    expect(result.content).toEqual([ANTISCAM_BANNER_BLOCK])
  })

  it("does not mutate the input object", () => {
    const original = { content: [{ type: "paragraph" }] }
    appendAntiscamBanner(original)
    expect(original.content).toEqual([{ type: "paragraph" }])
  })
})

describe("normalizePublisherEmail", () => {
  it("trims and lowercases a valid email", () => {
    expect(normalizePublisherEmail("  AdrianGoh@open.gov.sg  ")).toBe(
      "adriangoh@open.gov.sg",
    )
  })

  it("returns null for empty or whitespace-only input", () => {
    expect(normalizePublisherEmail("")).toBeNull()
    expect(normalizePublisherEmail("   ")).toBeNull()
  })
})

describe("describePublishedStep / describeDraftStep", () => {
  it("describes each published action", () => {
    expect(
      describePublishedStep({
        action: "create-version",
        newContent: { content: [] },
      }),
    ).toBe("published: create new version")
    expect(
      describePublishedStep({ action: "skip-already-has-banner" }),
    ).toBe("published: already has banner, skip")
    expect(describePublishedStep({ action: "skip-missing-content" })).toBe(
      "published: missing/invalid content, skip",
    )
    expect(describePublishedStep({ action: "none" })).toBe("published: none")
  })

  it("describes each draft action", () => {
    expect(
      describeDraftStep({
        action: "update-draft",
        newContent: { content: [] },
      }),
    ).toBe("draft: update in place")
    expect(describeDraftStep({ action: "skip-already-has-banner" })).toBe(
      "draft: already has banner, skip",
    )
    expect(describeDraftStep({ action: "skip-missing-content" })).toBe(
      "draft: missing/invalid content, skip",
    )
    expect(describeDraftStep({ action: "none" })).toBe("draft: none")
  })
})

describe("planResource", () => {
  it("published-only, no banner yet: creates a new version, no draft step", () => {
    const row = makeRow({
      publishedVersionId: "10",
      draftBlobId: null,
      publishedContent: { content: [{ type: "paragraph" }] },
    })
    const plan = planResource(row)

    expect(plan.bucket).toBe("published-only")
    expect(plan.publishedStep).toEqual({
      action: "create-version",
      newContent: {
        content: [{ type: "paragraph" }, ANTISCAM_BANNER_BLOCK],
      },
    })
    expect(plan.draftStep).toEqual({ action: "none" })
  })

  it("published-only, banner already present: skips the published step", () => {
    const row = makeRow({
      publishedVersionId: "10",
      draftBlobId: null,
      publishedContent: { content: [{ type: "antiscambanner" }] },
    })
    const plan = planResource(row)

    expect(plan.publishedStep).toEqual({ action: "skip-already-has-banner" })
    expect(plan.draftStep).toEqual({ action: "none" })
  })

  it("published-only, missing published content: skips without appending", () => {
    const row = makeRow({
      publishedVersionId: "10",
      draftBlobId: null,
      publishedContent: null,
    })
    const plan = planResource(row)

    expect(plan.publishedStep).toEqual({ action: "skip-missing-content" })
    expect(plan.draftStep).toEqual({ action: "none" })
  })

  it("published-only, invalid published content (string): skips without appending", () => {
    const row = makeRow({
      publishedVersionId: "10",
      draftBlobId: null,
      publishedContent: '{"content":[]}' as unknown as RootPageRow["publishedContent"],
    })
    const plan = planResource(row)

    expect(plan.publishedStep).toEqual({ action: "skip-missing-content" })
  })

  it("published-and-draft, neither has a banner: creates a version and updates the draft", () => {
    const row = makeRow({
      publishedVersionId: "10",
      draftBlobId: "20",
      publishedContent: { content: [{ type: "paragraph" }] },
      draftContent: { content: [{ type: "callout" }] },
    })
    const plan = planResource(row)

    expect(plan.bucket).toBe("published-and-draft")
    expect(plan.publishedStep).toEqual({
      action: "create-version",
      newContent: {
        content: [{ type: "paragraph" }, ANTISCAM_BANNER_BLOCK],
      },
    })
    expect(plan.draftStep).toEqual({
      action: "update-draft",
      newContent: { content: [{ type: "callout" }, ANTISCAM_BANNER_BLOCK] },
    })
  })

  it("published-and-draft: published and draft banners are checked independently", () => {
    const publishedAlreadyBannered = planResource(
      makeRow({
        publishedVersionId: "10",
        draftBlobId: "20",
        publishedContent: { content: [{ type: "antiscambanner" }] },
        draftContent: { content: [{ type: "callout" }] },
      }),
    )
    expect(publishedAlreadyBannered.publishedStep).toEqual({
      action: "skip-already-has-banner",
    })
    expect(publishedAlreadyBannered.draftStep.action).toBe("update-draft")

    const draftAlreadyBannered = planResource(
      makeRow({
        publishedVersionId: "10",
        draftBlobId: "20",
        publishedContent: { content: [{ type: "callout" }] },
        draftContent: { content: [{ type: "antiscambanner" }] },
      }),
    )
    expect(draftAlreadyBannered.publishedStep.action).toBe("create-version")
    expect(draftAlreadyBannered.draftStep).toEqual({
      action: "skip-already-has-banner",
    })
  })

  it("published-and-draft: missing draft content skips draft only", () => {
    const plan = planResource(
      makeRow({
        publishedVersionId: "10",
        draftBlobId: "20",
        publishedContent: { content: [{ type: "paragraph" }] },
        draftContent: null,
      }),
    )
    expect(plan.publishedStep.action).toBe("create-version")
    expect(plan.draftStep).toEqual({ action: "skip-missing-content" })
  })

  it("draft-only, no banner yet: updates the draft, no published step", () => {
    const row = makeRow({
      publishedVersionId: null,
      draftBlobId: "20",
      draftContent: { content: [{ type: "callout" }] },
    })
    const plan = planResource(row)

    expect(plan.bucket).toBe("draft-only")
    expect(plan.publishedStep).toEqual({ action: "none" })
    expect(plan.draftStep).toEqual({
      action: "update-draft",
      newContent: { content: [{ type: "callout" }, ANTISCAM_BANNER_BLOCK] },
    })
  })

  it("draft-only, banner already present: skips the draft step", () => {
    const row = makeRow({
      publishedVersionId: null,
      draftBlobId: "20",
      draftContent: { content: [{ type: "antiscambanner" }] },
    })
    const plan = planResource(row)

    expect(plan.draftStep).toEqual({ action: "skip-already-has-banner" })
  })

  it("draft-only, missing draft content: skips without appending", () => {
    const row = makeRow({
      publishedVersionId: null,
      draftBlobId: "20",
      draftContent: null,
    })
    const plan = planResource(row)

    expect(plan.draftStep).toEqual({ action: "skip-missing-content" })
    expect(plan.publishedStep).toEqual({ action: "none" })
  })

  it("neither published nor draft: both steps are none", () => {
    const row = makeRow({ publishedVersionId: null, draftBlobId: null })
    const plan = planResource(row)

    expect(plan.bucket).toBe("none")
    expect(plan.publishedStep).toEqual({ action: "none" })
    expect(plan.draftStep).toEqual({ action: "none" })
  })
})
