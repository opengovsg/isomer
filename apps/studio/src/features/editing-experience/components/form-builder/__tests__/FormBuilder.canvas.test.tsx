import type { IsomerComponent } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import { ErrorProvider } from "../ErrorProvider"
import FormBuilder from "../FormBuilder"

// Mirrors the composition in ComplexEditorStateDrawer: the schema comes from
// getComponentSchema and FormBuilder renders inside an ErrorProvider
const canvasSchema = getComponentSchema({ component: "canvas" })
const validateFn = ajv.compile<IsomerComponent>(canvasSchema)

const renderCanvasForm = (data: unknown) =>
  renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <ErrorProvider>
        <FormBuilder<IsomerComponent>
          schema={canvasSchema}
          validateFn={validateFn}
          data={data}
          handleChange={() => undefined}
        />
      </ErrorProvider>
    </ThemeProvider>,
  )

describe("FormBuilder with the canvas schema", () => {
  it("should render the width and height resize fields", () => {
    const markup = renderCanvasForm({ type: "canvas", blocks: [] })

    expect(markup).toContain("Width (%)")
    expect(markup).toContain("Height (px)")
  })

  it("should render the blocks array editor with an add button", () => {
    const markup = renderCanvasForm({ type: "canvas", blocks: [] })

    // The array control header and its empty state — if the blocks control
    // fell through to the catch-all null renderer, none of this would render
    expect(markup).toContain("Canvas blocks")
    expect(markup).toContain("Add item")
    expect(markup).toContain("Items you add will appear here")
  })

  it("should render a list entry for each existing canvas block", () => {
    const markup = renderCanvasForm({
      type: "canvas",
      width: 80,
      height: 320,
      blocks: [
        {
          type: "callout",
          content: {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Hello from the canvas" }],
              },
            ],
          },
        },
        { type: "image", src: "/images/1.png", alt: "A test image" },
      ],
    })

    expect(markup).toContain("Item 1")
    expect(markup).toContain("Item 2")
    expect(markup).not.toContain("Items you add will appear here")
  })

  it("should render list entries for the widened set of child block types", () => {
    const markup = renderCanvasForm({
      type: "canvas",
      blocks: [
        {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Text inside the canvas" }],
            },
          ],
        },
        { type: "blockquote", quote: "A quote", source: "A source" },
        {
          type: "keystatistics",
          title: "Stats",
          statistics: [{ label: "A label", value: "42" }],
        },
        { type: "video", url: "https://www.youtube.com/embed/x", title: "V" },
      ],
    })

    expect(markup).toContain("Item 1")
    expect(markup).toContain("Item 4")
    expect(markup).not.toContain("Items you add will appear here")
  })

  it("accepts every widened child type as valid canvas block data", () => {
    const validated = validateFn({
      type: "canvas",
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
          // the gallery requires at least 2 images
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
    })

    expect(validateFn.errors ?? []).toEqual([])
    expect(validated).toBe(true)
  })
})
