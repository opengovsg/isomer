import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { theme } from "~/theme"

import { LINK_TYPES_MAPPING } from "../constants"
import { LinkEditorContextProvider } from "../LinkEditorContext"
import { LinkHrefEditor } from "../LinkHrefEditor"

const renderLinkHrefEditor = (linkHref: string) => {
  const onChange = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <LinkEditorContextProvider
        linkHref={linkHref}
        linkTypes={LINK_TYPES_MAPPING}
        onChange={onChange}
      >
        <LinkHrefEditor
          label="Link destination"
          pageLinkElement={
            <div data-testid="page-link-editor">Page picker</div>
          }
          fileLinkElement={
            <div data-testid="file-link-editor">File picker</div>
          }
        />
      </LinkEditorContextProvider>
    </ThemeProvider>,
  )
  return { onChange }
}

const getLinkTypeRadio = (label: string) =>
  screen.getByRole("radio", { name: new RegExp(label, "i") })

type InitialLinkTypeCase =
  | {
      label: string
      linkHref: string
      visibleTestId: string
    }
  | {
      label: string
      linkHref: string
      inputValue: string
    }

describe("LinkHrefEditor", () => {
  it.each<InitialLinkTypeCase>([
    {
      label: "Page",
      linkHref: "[resource:1:42]",
      visibleTestId: "page-link-editor",
    },
    {
      label: "File",
      linkHref: "/123/550e8400-e29b-41d4-a716-446655440000/doc.pdf",
      visibleTestId: "file-link-editor",
    },
    {
      label: "External",
      linkHref: "https://www.isomer.gov.sg/about",
      inputValue: "www.isomer.gov.sg/about",
    },
    {
      label: "External",
      linkHref:
        "http://malicious-site.com/path/456/01234567-89ab-cdef-0123-456789abcdef/phishing.html",
      inputValue:
        "malicious-site.com/path/456/01234567-89ab-cdef-0123-456789abcdef/phishing.html",
    },
    {
      label: "Email",
      linkHref: "mailto:user@example.com",
      inputValue: "user@example.com",
    },
  ])("opens with $label selected for the matching href", (case_) => {
    renderLinkHrefEditor(case_.linkHref)

    expect(getLinkTypeRadio(case_.label)).toBeChecked()

    if ("visibleTestId" in case_) {
      expect(screen.getByTestId(case_.visibleTestId)).toBeVisible()
      return
    }

    expect(screen.getByRole("textbox")).toHaveValue(case_.inputValue)
  })

  it("updates the selected type and visible destination input when switching types", async () => {
    renderLinkHrefEditor("[resource:1:42]")

    expect(getLinkTypeRadio("Page")).toBeChecked()
    expect(screen.getByTestId("page-link-editor")).toBeVisible()

    await userEvent.click(getLinkTypeRadio("External"))

    expect(getLinkTypeRadio("External")).toBeChecked()
    expect(screen.queryByTestId("page-link-editor")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeVisible()

    await userEvent.click(getLinkTypeRadio("Email"))

    expect(getLinkTypeRadio("Email")).toBeChecked()
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "test@example.com",
    )
  })
})
