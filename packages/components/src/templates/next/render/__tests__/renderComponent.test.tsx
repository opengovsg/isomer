import type { IsomerComponent } from "~/types"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { renderComponent } from "../renderComponent"
import { renderPageContent } from "../renderPageContent"

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

    // Site visitors must not get a native resize handle on the published
    // page — free resizing is an editor-only affordance applied by Studio
    expect(html).not.toContain("resize")
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

  it("forwards shouldLazyLoad to child components inside a canvas", () => {
    const canvasWithImage: IsomerComponent = {
      type: "canvas",
      blocks: [{ type: "image", src: "https://example.com/a.png", alt: "a" }],
    }

    const eagerHtml = renderToStaticMarkup(
      renderComponent({
        component: canvasWithImage,
        shouldLazyLoad: false,
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )
    const lazyHtml = renderToStaticMarkup(
      renderComponent({
        component: canvasWithImage,
        shouldLazyLoad: true,
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(eagerHtml).toContain('loading="eager"')
    expect(lazyHtml).toContain('loading="lazy"')
  })

  it("eagerly loads the image of a canvas that is the page's first image-bearing component", () => {
    const html = renderToStaticMarkup(
      <>
        {renderPageContent({
          content: [
            {
              type: "canvas",
              blocks: [
                {
                  type: "image",
                  src: "https://example.com/first.png",
                  alt: "first",
                },
              ],
            },
            {
              type: "image",
              src: "https://example.com/second.png",
              alt: "second",
            },
          ],
          layout: "content",
          site: generateSiteConfig(),
          permalink: "/",
        })}
      </>,
    )

    const firstImage = html.slice(0, html.indexOf("second.png"))
    const secondImage = html.slice(html.indexOf("second.png"))
    expect(firstImage).toContain('loading="eager"')
    expect(secondImage).toContain('loading="lazy"')
  })

  it("renders the canvas scroll container as keyboard-focusable", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: { type: "canvas", height: 200, blocks: [] },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain('tabindex="0"')
  })

  it("marks the canvas container and each block wrapper with locator data attributes", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [
            { type: "blockquote", quote: "First", source: "s" },
            { type: "blockquote", quote: "Second", source: "s" },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    // Editors (e.g. Studio's preview highlight) locate blocks via these
    // attributes, so they are part of the rendered contract
    expect(html).toContain("data-canvas-container")
    expect(html).toContain('data-canvas-block-index="0"')
    expect(html).toContain('data-canvas-block-index="1"')
  })

  it("places canvas blocks on the grid according to their placement fields", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "blockquote",
              quote: "Placed block",
              source: "A source",
              placement: { colStart: 3, colSpan: 6, rowStart: 2, rowSpan: 4 },
            },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("grid-cols-12")
    expect(html).toContain("--canvas-grid-column:3 / span 6")
    expect(html).toContain("--canvas-grid-row:2 / span 4")
  })

  it("applies grid placement from the md breakpoint up and stacks blocks full-width below it", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [
            {
              type: "blockquote",
              quote: "Placed block",
              source: "A source",
              placement: { colStart: 3, colSpan: 6, rowStart: 2, rowSpan: 4 },
            },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    // Base (mobile) class stacks the block across the full width; the
    // placement is only consumed by the md: responsive classes.
    expect(html).toContain("col-span-full")
    expect(html).toContain("md:[grid-column:var(--canvas-grid-column)]")
    expect(html).toContain("md:[grid-row:var(--canvas-grid-row,auto)]")
    // No non-responsive inline grid-column — that would place the block on
    // the 12-column grid at every viewport (the [";] guard skips the
    // --canvas-grid-column custom property, which also ends in that name)
    expect(html).not.toMatch(/[";]grid-column:/)
  })

  it("stacks placement-less canvas blocks across the full grid width", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [{ type: "blockquote", quote: "Unplaced", source: "s" }],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("--canvas-grid-column:1 / -1")
    expect(html).not.toContain("--canvas-grid-row:")
  })

  it("clamps and defaults partial grid placements", () => {
    const html = renderToStaticMarkup(
      renderComponent({
        component: {
          type: "canvas",
          blocks: [
            // colStart + colSpan overflowing the grid is clamped to the edge
            {
              type: "blockquote",
              quote: "Clamped",
              source: "s",
              placement: { colStart: 10, colSpan: 6 },
            },
            // colStart alone extends to the last column
            {
              type: "blockquote",
              quote: "To the end",
              source: "s",
              placement: { colStart: 4 },
            },
            // colSpan alone auto-places with the given width
            {
              type: "blockquote",
              quote: "Auto-placed",
              source: "s",
              placement: { colSpan: 5, rowSpan: 2 },
            },
          ],
        },
        layout: "content",
        site: generateSiteConfig(),
        permalink: "/",
      }),
    )

    expect(html).toContain("--canvas-grid-column:10 / span 3")
    expect(html).toContain("--canvas-grid-column:4 / -1")
    expect(html).toContain("--canvas-grid-column:span 5")
    expect(html).toContain("--canvas-grid-row:span 2")
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

    expect(html).not.toContain("resize")
    expect(html).not.toContain("width:")
  })
})
