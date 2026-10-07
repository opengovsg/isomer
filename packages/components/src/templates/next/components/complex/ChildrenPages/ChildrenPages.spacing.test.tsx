import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { ChildrenPages } from "./ChildrenPages"

const site = generateSiteConfig({
  siteMap: {
    id: "1",
    title: "Site",
    permalink: "/",
    lastModified: "",
    layout: "homepage",
    summary: "",
    children: [
      {
        id: "2",
        title: "Folder",
        permalink: "/folder",
        lastModified: "",
        layout: "index",
        summary: "",
        children: [
          {
            id: "3",
            title: "Child page",
            permalink: "/folder/child",
            lastModified: "",
            layout: "content",
            summary: "Summary text",
          },
        ],
      },
    ],
  },
})

describe("ChildrenPages spacing", () => {
  it("matches InfoCards block spacing for row layout without thumbnails", () => {
    const html = renderToStaticMarkup(
      <ChildrenPages
        type="childrenpages"
        variant="rows"
        permalink="/folder"
        site={site}
        showThumbnail={false}
        showSummary
        headingLevel={2}
      />,
    )

    expect(html).toMatch(
      /class="[^"]*component-content[^"]*mt-14[^"]*first:mt-0/,
    )
    expect(html).toMatch(/class="[^"]*gap-10[^"]*lg:gap-y-12/)
  })
})
