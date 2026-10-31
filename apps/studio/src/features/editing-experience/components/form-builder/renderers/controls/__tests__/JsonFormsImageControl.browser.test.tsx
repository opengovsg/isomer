import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
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
// Stub the upload input so this test isolates JsonFormsImageControl's own render
// (the crash is in its derived-const block, before this renders) without pulling
// in FileAttachment's tRPC/upload deps.
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

// Regression: an EMPTY image field (e.g. the logo-settings favicon slot) made
// editingOriginalKey undefined, and `uploadedOriginalRef.current?.key ===
// editingOriginalKey` evaluated `undefined === undefined` → true, dereferencing
// the null ref (TypeError: reading 'file') and crashing the whole page.
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
})
