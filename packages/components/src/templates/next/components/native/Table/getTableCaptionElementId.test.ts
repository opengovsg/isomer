import { describe, expect, it } from "vitest"

import {
  getTableCaptionElementId,
  hasVisibleTableCaption,
} from "./getTableCaptionElementId"

describe("getTableCaptionElementId", () => {
  it("is stable for the same caption and table shape", () => {
    const content = [
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "A" }],
              },
            ],
          },
        ],
      },
    ]

    const first = getTableCaptionElementId("Year / Agency", content)
    const second = getTableCaptionElementId("Year / Agency", content)

    expect(first).toBe(second)
    expect(first).toMatch(/^isomer-table-caption-[0-9a-z]+$/)
  })

  it("differs when caption text differs", () => {
    const content = [
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "A" }],
              },
            ],
          },
        ],
      },
    ]

    expect(getTableCaptionElementId("One", content)).not.toBe(
      getTableCaptionElementId("Two", content),
    )
  })
})

describe("hasVisibleTableCaption", () => {
  it("treats whitespace-only captions as empty", () => {
    expect(hasVisibleTableCaption("   ")).toBe(false)
    expect(hasVisibleTableCaption("Caption")).toBe(true)
  })
})
