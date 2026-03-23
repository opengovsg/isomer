import { describe, expect, it } from "vitest"

import type { VicaWidgetProps } from "~/interfaces"
import { VicaWidget } from "../VicaWidget"

describe("VicaWidget", () => {
  it("should resolve app-icon using siteMap fallback when siteMapArray is missing", () => {
    const result = VicaWidget({
      site: {
        siteMap: {
          id: "root",
          title: "Home",
          summary: "",
          lastModified: "",
          permalink: "/",
          layout: "homepage",
          children: [
            {
              id: "page-1",
              title: "Page 1",
              summary: "",
              lastModified: "",
              permalink: "/page-1",
              layout: "content",
            },
          ],
        },
        assetsBaseUrl: "https://assets.example.com",
      },
      "app-id": "example-app-id",
      "app-icon": "[resource:1:page-1]",
    } satisfies VicaWidgetProps)

    expect(result.props["app-icon"]).toBe("/page-1")
  })
})
