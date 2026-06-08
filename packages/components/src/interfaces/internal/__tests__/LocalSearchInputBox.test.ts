import { FormatRegistry } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

import { LocalSearchSchema } from "../LocalSearchInputBox"

// "hidden" is a custom Isomer format used to hide fields in the editor UI.
// TypeBox's Value.Check rejects unknown formats, so we register it here as
// a no-op validator so pattern/type checks still run correctly.
FormatRegistry.Set("hidden", () => true)

const makeInput = (searchUrl: string) => ({
  type: "localSearch" as const,
  searchUrl,
})

describe("LocalSearchSchema", () => {
  describe("searchUrl — valid values", () => {
    it.each(["/", "/search", "/foo/bar"])(
      "should accept relative path %s",
      (searchUrl) => {
        expect(Value.Check(LocalSearchSchema, makeInput(searchUrl))).toBe(true)
      },
    )

    it.each(["[resource:1:2]", "[resource:123:456]"])(
      "should accept internal resource reference %s",
      (searchUrl) => {
        expect(Value.Check(LocalSearchSchema, makeInput(searchUrl))).toBe(true)
      },
    )
  })

  describe("searchUrl — invalid values", () => {
    it.each(["https://attacker.com", "http://evil.com"])(
      "should reject external URL %s",
      (searchUrl) => {
        expect(Value.Check(LocalSearchSchema, makeInput(searchUrl))).toBe(false)
      },
    )

    it.each([
      "[resource:abc:def]",
      "[resource:1:]",
      "[resources:1:2]",
      "resource:1:2",
      "[resource:1:2",
    ])("should reject malformed resource reference %s", (searchUrl) => {
      expect(Value.Check(LocalSearchSchema, makeInput(searchUrl))).toBe(false)
    })

    it("should reject empty string", () => {
      expect(Value.Check(LocalSearchSchema, makeInput(""))).toBe(false)
    })
  })
})
