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
})
