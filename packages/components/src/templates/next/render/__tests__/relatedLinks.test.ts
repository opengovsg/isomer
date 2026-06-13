import { describe, expect, it } from "vitest"
import type { IsomerSchema } from "~/types"

import { doesComponentHaveImage } from "../doesComponentHaveImage"
import { renderComponentPreviewText } from "../renderComponentPreviewText"

describe("relatedlinks render helpers", () => {
  it("renders configured heading as preview text", () => {
    const component: IsomerSchema["content"][number] = {
      type: "relatedlinks",
      heading: "Related resources",
      links: [{ title: "FAQ", url: "/faq" }],
    }

    expect(
      renderComponentPreviewText({
        component,
      }),
    ).toBe("Related resources")
  })

  it("uses default preview text and reports no image when heading is omitted", () => {
    const component: IsomerSchema["content"][number] = {
      type: "relatedlinks",
      links: [{ title: "FAQ", url: "/faq" }],
    }

    expect(renderComponentPreviewText({ component })).toBe("Related links")
    expect(doesComponentHaveImage({ component })).toBe(false)
  })
})
