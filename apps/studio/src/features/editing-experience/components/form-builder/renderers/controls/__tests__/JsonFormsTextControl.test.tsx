// @vitest-environment jsdom

import { ThemeProvider } from "@opengovsg/design-system-react"
import { TRIMMED_NON_EMPTY_STRING_REGEX } from "@opengovsg/isomer-components"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { ErrorProvider } from "../../../ErrorProvider"
import { JsonFormsTextControl } from "../JsonFormsTextControl"

const renderControl = ({
  data = "Get started",
  required = false,
}: {
  data?: string
  required?: boolean
} = {}) => {
  const handleChange = vi.fn()

  render(
    <ThemeProvider theme={theme}>
      <ErrorProvider>
        <JsonFormsTextControl
          data={data}
          label="Title"
          handleChange={handleChange}
          path="quickActionsTitle"
          errors=""
          schema={{
            type: "string",
            pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
          }}
          enabled
          visible
          id="quickActionsTitle"
          rootSchema={{}}
          uischema={{
            type: "Control",
            scope: "#/properties/quickActionsTitle",
          }}
          required={required}
        />
      </ErrorProvider>
    </ThemeProvider>,
  )

  return { handleChange }
}

describe("JsonFormsTextControl", () => {
  it("clears optional patterned fields with undefined instead of an empty string", () => {
    const { handleChange } = renderControl({ required: false })

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "" },
    })

    expect(handleChange).toHaveBeenCalledWith("quickActionsTitle", undefined)
  })

  it("clears required fields with undefined so the property is dropped", () => {
    const { handleChange } = renderControl({ required: true })

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "" },
    })

    expect(handleChange).toHaveBeenCalledWith("quickActionsTitle", undefined)
  })
})
