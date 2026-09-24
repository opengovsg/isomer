import { describe, expect, it } from "vitest"

import { shadowingSourceCandidates } from "../redirect.service"

describe("shadowingSourceCandidates", () => {
  it("lists the exact path then each ancestor wildcard, deepest first", () => {
    expect(shadowingSourceCandidates("/a/b/c")).toEqual([
      "/a/b/c",
      "/a/b/*",
      "/a/*",
    ])
  })

  it("normalises the input before generating candidates", () => {
    expect(shadowingSourceCandidates("/A/B//C/")).toEqual([
      "/a/b/c",
      "/a/b/*",
      "/a/*",
    ])
  })

  it("never emits a root wildcard for a single-segment path", () => {
    // "/a" could only be shadowed by an exact "/a" — a root "/*" is impossible
    // (the schema rejects it), so no wildcard candidate is produced.
    expect(shadowingSourceCandidates("/a")).toEqual(["/a"])
  })
})
