import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { theme } from "~/theme"

import { LINK_TYPES, LINK_TYPES_MAPPING } from "../constants"
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

type LinkTypeLabel = "Page" | "File" | "External" | "Email"

const LINK_TYPE_RADIO_VALUE: Record<LinkTypeLabel, string> = {
  Page: LINK_TYPES.Page,
  File: LINK_TYPES.File,
  External: LINK_TYPES.External,
  Email: LINK_TYPES.Email,
}

/** Chakra radios omit visible label text from the accessible name in real browsers. */
const getLinkTypeRadio = (linkType: LinkTypeLabel) => {
  const radio = screen
    .getAllByRole("radio")
    .find((el) => el.getAttribute("value") === LINK_TYPE_RADIO_VALUE[linkType])
  if (!radio) {
    throw new Error(`Link type radio not found: ${linkType}`)
  }
  return radio
}

/** Chakra useRadio overlays the input; click the wrapping label, not the input. */
const clickLinkTypeRadio = async (linkType: LinkTypeLabel) => {
  const label = getLinkTypeRadio(linkType).closest("label")
  if (!label) {
    throw new Error(`Link type radio label not found: ${linkType}`)
  }
  await userEvent.click(label)
}

type InitialLinkTypeCase =
  | {
      linkType: LinkTypeLabel
      linkHref: string
      visibleTestId: string
    }
  | {
      linkType: LinkTypeLabel
      linkHref: string
      inputValue: string
    }

describe("LinkHrefEditor", () => {
  it.each<InitialLinkTypeCase>([
    {
      linkType: "Page",
      linkHref: "[resource:1:42]",
      visibleTestId: "page-link-editor",
    },
    {
      linkType: "File",
      linkHref: "/123/550e8400-e29b-41d4-a716-446655440000/doc.pdf",
      visibleTestId: "file-link-editor",
    },
    {
      linkType: "External",
      linkHref: "https://www.isomer.gov.sg/about",
      inputValue: "www.isomer.gov.sg/about",
    },
    {
      linkType: "External",
      linkHref:
        "http://malicious-site.com/path/456/01234567-89ab-cdef-0123-456789abcdef/phishing.html",
      inputValue:
        "malicious-site.com/path/456/01234567-89ab-cdef-0123-456789abcdef/phishing.html",
    },
    {
      linkType: "Email",
      linkHref: "mailto:user@example.com",
      inputValue: "user@example.com",
    },
  ])("opens with $linkType selected for the matching href", (case_) => {
    // Arrange / Act
    renderLinkHrefEditor(case_.linkHref)

    // Assert
    expect(getLinkTypeRadio(case_.linkType)).toBeChecked()

    if ("visibleTestId" in case_) {
      expect(screen.getByTestId(case_.visibleTestId)).toBeVisible()
      return
    }

    expect(screen.getByRole("textbox")).toHaveValue(case_.inputValue)
  })

  it("updates the selected type and visible destination input when switching types", async () => {
    // Arrange / Act — open existing page link
    renderLinkHrefEditor("[resource:1:42]")

    // Assert — page type and picker
    expect(getLinkTypeRadio("Page")).toBeChecked()
    expect(screen.getByTestId("page-link-editor")).toBeVisible()

    // Act — switch to external
    await clickLinkTypeRadio("External")

    // Assert — external input
    expect(getLinkTypeRadio("External")).toBeChecked()
    expect(screen.queryByTestId("page-link-editor")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeVisible()

    // Act — switch to email
    await clickLinkTypeRadio("Email")

    // Assert — email input
    expect(getLinkTypeRadio("Email")).toBeChecked()
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "test@example.com",
    )
  })
})
