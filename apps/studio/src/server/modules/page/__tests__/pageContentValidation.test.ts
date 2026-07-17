import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"
import { ajv } from "~/utils/ajv"

// Mirrors the module-load compilation in page.router.ts: if the full page
// schema ever becomes uncompilable (e.g. a canvas child schema inlining a
// duplicate $id), every page mutation in Studio breaks, not just canvas
const schemaValidator = ajv.compile<IsomerSchema>(schema)

const buildContentPage = (content: unknown[]): Record<string, unknown> => ({
  layout: "content",
  page: {
    title: "Page title here",
    permalink: "/page-title-here",
    lastModified: "2024-09-11T08:32:44.000Z",
    contentPageHeader: { summary: "A summary" },
  },
  content,
  version: "0.1.0",
})

describe("page content validation (server-side save gate)", () => {
  it("accepts a content page containing a canvas with every supported child type", () => {
    const page = buildContentPage([
      {
        type: "canvas",
        width: 80,
        height: 400,
        blocks: [
          { type: "image", src: "/images/1.png", alt: "A test image" },
          {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Text inside the canvas" }],
              },
            ],
          },
          {
            type: "callout",
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "A callout" }],
                },
              ],
            },
          },
          {
            type: "accordion",
            summary: "An accordion",
            details: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Accordion details" }],
                },
              ],
            },
          },
          { type: "blockquote", quote: "A quote", source: "A source" },
          {
            type: "contentpic",
            imageSrc: "/images/1.png",
            imageAlt: "An image",
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Side text" }],
                },
              ],
            },
          },
          {
            type: "infocols",
            title: "Columns",
            infoBoxes: [{ title: "Box", description: "Desc" }],
          },
          {
            type: "keystatistics",
            title: "Stats",
            statistics: [{ label: "A label", value: "42" }],
          },
          {
            type: "imagegallery",
            images: [
              { src: "/images/1.png", alt: "First image", caption: "One" },
              { src: "/images/2.png", alt: "Second image", caption: "Two" },
            ],
          },
          {
            type: "map",
            url: "https://www.google.com/maps/embed?pb=!1m2",
            title: "Map",
          },
          {
            type: "video",
            url: "https://www.youtube.com/embed/x",
            title: "Video",
          },
        ],
      },
    ])

    const isValid = schemaValidator(page)

    expect(schemaValidator.errors ?? []).toEqual([])
    expect(isValid).toBe(true)
  })

  it("accepts a content page containing an empty canvas without resize values", () => {
    const page = buildContentPage([{ type: "canvas", blocks: [] }])

    const isValid = schemaValidator(page)

    expect(schemaValidator.errors ?? []).toEqual([])
    expect(isValid).toBe(true)
  })

  it("rejects a canvas child whose type is not in the canvas blocks union", () => {
    const page = buildContentPage([
      {
        type: "canvas",
        blocks: [
          {
            type: "infobar",
            title: "Not allowed inside a canvas",
            description: "infobar is a page-level block, not a canvas child",
          },
        ],
      },
    ])

    expect(schemaValidator(page)).toBe(false)
  })

  it("rejects canvas resize values outside the schema bounds", () => {
    const page = buildContentPage([{ type: "canvas", width: 101, blocks: [] }])

    expect(schemaValidator(page)).toBe(false)
  })

  it("accepts canvas children carrying grid placement fields", () => {
    const page = buildContentPage([
      {
        type: "canvas",
        blocks: [
          {
            type: "image",
            src: "/images/1.png",
            alt: "A placed image",
            placement: { colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 3 },
          },
          {
            type: "blockquote",
            quote: "Placed beside the image",
            source: "A source",
            placement: { colStart: 7, colSpan: 6 },
          },
        ],
      },
    ])

    const isValid = schemaValidator(page)

    expect(schemaValidator.errors ?? []).toEqual([])
    expect(isValid).toBe(true)
  })

  it("rejects grid placement values outside the 12-column grid", () => {
    const page = buildContentPage([
      {
        type: "canvas",
        blocks: [
          {
            type: "blockquote",
            quote: "Too wide",
            source: "A source",
            placement: { colSpan: 13 },
          },
        ],
      },
    ])

    expect(schemaValidator(page)).toBe(false)
  })
})
