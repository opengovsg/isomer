// @vitest-environment jsdom

import type { ComponentProps } from "react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { TRIMMED_NON_EMPTY_STRING_REGEX } from "@opengovsg/isomer-components"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { ErrorProvider } from "../../../ErrorProvider"
import { JsonFormsTextControl } from "../JsonFormsTextControl"

const renderControl = (
  props: Partial<ComponentProps<typeof JsonFormsTextControl>> = {},
) => {
  const handleChange = vi.fn()

  render(
    <ThemeProvider theme={theme}>
      <ErrorProvider>
        <JsonFormsTextControl
          data={props.data ?? "Get started"}
          label="Title"
          handleChange={handleChange}
          path="quickActionsTitle"
          description={undefined}
          required={props.required ?? false}
          errors=""
          schema={{
            type: "string",
            pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
          }}
          enabled={true}
          {...props}
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

  it("clears required fields with an empty string", () => {
    const { handleChange } = renderControl({ required: true })

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "" },
    })

    expect(handleChange).toHaveBeenCalledWith("quickActionsTitle", "")
  })
})
