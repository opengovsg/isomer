import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import jsonFormsVerticalLayoutRenderer, {
  jsonFormsVerticalLayoutTester,
} from "../../layouts/JsonFormsVerticalLayout"
import JsonFormsImageControl, {
  jsonFormsImageControlTester,
} from "../JsonFormsImageControl"

vi.mock("~/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: "user-content.example.com",
  },
}))
vi.mock("~/hooks/useQueryParse", () => ({
  useQueryParse: () => ({ siteId: 1, pageId: undefined, linkId: undefined }),
}))
vi.mock("~/hooks/useIsImageAdjustmentEnabled", () => ({
  useIsImageAdjustmentEnabled: () => false,
}))
vi.mock("../../../hooks/useAdjustmentConfigForField", () => ({
  useAdjustmentConfigForField: () => ({
    fieldHost: { imageFit: "contain" },
    config: { ownsImageFitField: true },
  }),
}))
// Stubbed to keep FileAttachment's tRPC and upload deps out of this test.
vi.mock("~/components/PageEditor/FileAttachment", () => ({
  FileAttachment: () => <div data-testid="file-attachment" />,
}))
// No EditorDrawerProvider wraps this test, so useCollectionIndexVariant's
// queries are always disabled -- stub just enough of the tRPC client shape
// for its (never-fired) useQuery calls to not blow up on a missing context.
vi.mock("~/utils/trpc", () => ({
  trpc: {
    resource: { getParentOf: { useQuery: () => ({ data: undefined }) } },
    folder: { getIndexpage: { useQuery: () => ({ data: undefined }) } },
    page: { readPageAndBlob: { useQuery: () => ({ data: undefined }) } },
  },
}))

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsImageControlTester, renderer: JsonFormsImageControl },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

const schema = {
  type: "object",
  properties: {
    logoUrl: { type: "string", format: "image", title: "Logo" },
  },
} as const

// Regression. On an empty field, such as the favicon slot, the retained
// upload's key and editingOriginalKey were both undefined. They matched, and
// the control read `.file` off a null ref and crashed the page.
describe("JsonFormsImageControl", () => {
  it("renders an empty image field without crashing", () => {
    render(
      <ThemeProvider theme={theme}>
        <JsonForms
          schema={schema}
          data={{}}
          renderers={renderers}
          ajv={ajv}
          onChange={() => undefined}
        />
      </ThemeProvider>,
    )
    expect(screen.getByTestId("file-attachment")).toBeInTheDocument()
  })

  it("offers the image fit choice inline when Adjust is unavailable", async () => {
    const onChange = vi.fn()
    render(
      <ThemeProvider theme={theme}>
        <JsonForms
          schema={schema}
          data={{ logoUrl: "https://example.com/logo.png" }}
          renderers={renderers}
          ajv={ajv}
          onChange={onChange}
        />
      </ThemeProvider>,
    )
    expect(
      screen.getByRole("radiogroup", { name: "Image display" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Default (recommended)")).toBeInTheDocument()
    expect(screen.getByLabelText("Resize image to fit")).toBeChecked()

    fireEvent.click(screen.getByLabelText("Default (recommended)"))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageFit: "cover" }),
        }),
      ),
    )
  })

  it("offers Replace image for an external image that can't be adjusted", () => {
    render(
      <ThemeProvider theme={theme}>
        <JsonForms
          schema={schema}
          data={{ logoUrl: "https://placehold.co/600x400" }}
          renderers={renderers}
          ajv={ajv}
          onChange={() => undefined}
        />
      </ThemeProvider>,
    )
    expect(screen.getByText("Replace image")).toBeInTheDocument()
    expect(screen.queryByText("Edit image")).not.toBeInTheDocument()
  })
})
