import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { generateSiteConfig } from "~/stories/helpers"
import { renderComponent } from "../renderComponent"

describe("renderComponent", () => {
  it("renders a canvas component with its child components", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          width: 50,
          height: 400,
          blocks: [
            {
              type: "callout",
              content: {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Inside the canvas" }],
                  },
                ],
              },
            },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("resize")
    expect(html).toContain("width:50%")
    expect(html).toContain("height:400px")
    expect(html).toContain("Inside the canvas")
  })

  it("renders the widened set of canvas child components", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Plain text child" }],
                },
              ],
            },
            {
              type: "blockquote",
              quote: "A quote inside the canvas",
              source: "A source",
            },
            {
              type: "keystatistics",
              title: "Stats inside the canvas",
              statistics: [{ label: "A label", value: "42" }],
            },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("Plain text child")
    expect(html).toContain("A quote inside the canvas")
    expect(html).toContain("Stats inside the canvas")
    expect(html).toContain("42")
  })

  it("renders a canvas without explicit dimensions", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: { type: "canvas", blocks: [] },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("resize")
    expect(html).not.toContain("width:")
  })
})
