import path from "node:path"
import { describe, expect, it } from "vitest"

import {
  escapeRegExp,
  getPermalinkFromPath,
  getRouteFromPath,
  PAGE_FILE_NAME,
} from "../paths"

const appDir = path.join("/fake", "app")

// Just-in-case good-practice tests: we don't expect page file names with regex
// metacharacters from our DB, but escaping them keeps the implementation robust.
describe("escapeRegExp", () => {
  it("escapes dot", () => {
    expect(escapeRegExp("page.tsx")).toBe("page\\.tsx")
  })

  it("escapes backslash", () => {
    expect(escapeRegExp("a\\b")).toBe("a\\\\b")
  })

  it("escapes regex metacharacters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    )
  })

  it("leaves plain alphanumerics and hyphens unchanged", () => {
    expect(escapeRegExp("page-1")).toBe("page-1")
  })

  it("produces a string that matches literally in a RegExp", () => {
    const literal = "file (1).tsx"
    const escaped = escapeRegExp(literal)
    const re = new RegExp(escaped)
    expect("path/to/file (1).tsx".replace(re, "")).toBe("path/to/")
  })
})

describe("getPermalinkFromPath", () => {
  it("returns [] for root page.tsx", () => {
    expect(getPermalinkFromPath(path.join(appDir, "page.tsx"), appDir)).toEqual(
      [],
    )
  })

  it("returns single segment for one-level path", () => {
    expect(
      getPermalinkFromPath(path.join(appDir, "contact", "page.tsx"), appDir),
    ).toEqual(["contact"])
  })

  it("returns segments for nested path", () => {
    expect(
      getPermalinkFromPath(
        path.join(appDir, "the-president", "former-presidents", "page.tsx"),
        appDir,
      ),
    ).toEqual(["the-president", "former-presidents"])
  })

  it("uses custom page file name when provided", () => {
    expect(
      getPermalinkFromPath(
        path.join(appDir, "foo", "page.tsx"),
        appDir,
        "page.tsx",
      ),
    ).toEqual(["foo"])
  })
})

describe("getRouteFromPath", () => {
  it("returns / for root page.tsx", () => {
    expect(getRouteFromPath(path.join(appDir, "page.tsx"), appDir)).toBe("/")
  })

  it("returns /segment for one-level path", () => {
    expect(
      getRouteFromPath(path.join(appDir, "contact", "page.tsx"), appDir),
    ).toBe("/contact")
  })

  it("returns /a/b for nested path", () => {
    expect(
      getRouteFromPath(
        path.join(appDir, "the-president", "former-presidents", "page.tsx"),
        appDir,
      ),
    ).toBe("/the-president/former-presidents")
  })
})

describe("PAGE_FILE_NAME", () => {
  it("is page.tsx", () => {
    expect(PAGE_FILE_NAME).toBe("page.tsx")
  })
})
