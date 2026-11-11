import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { Type } from "@sinclair/typebox"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import jsonFormsVerticalLayoutRenderer, {
  jsonFormsVerticalLayoutTester,
} from "../../layouts/JsonFormsVerticalLayout"
import JsonFormsImageControl, {
  jsonFormsImageControlTester,
} from "../JsonFormsImageControl"

const UPLOADED_PATH = "/1/uuid/hero.png"

vi.mock("~/hooks/useQueryParse", () => ({
  useQueryParse: () => ({ siteId: 1, pageId: 1 }),
}))

// Stand-in for the presign + PUT round trip; the control only sees the path
// that FileAttachment reports once it succeeds.
vi.mock("~/hooks/useUploadAssetMutation", () => ({
  useUploadAssetMutation: () => ({
    mutate: (
      _input: { file: File },
      { onSuccess }: { onSuccess: (res: { path: string }) => void },
    ) => onSuccess({ path: UPLOADED_PATH }),
  }),
}))

// The CDN availability check, resolved or rejected by each test. Like the real
// hook, `isLoading` stays true while it runs.
const handleAssetUpload = vi.fn<(src: string) => Promise<string>>()
vi.mock(
  "~/features/editing-experience/components/form-builder/hooks/useAssetUpload",
  async () => {
    const { useState } = await import("react")
    return {
      useAssetUpload: () => {
        const [isLoading, setIsLoading] = useState(false)
        return {
          isLoading,
          handleAssetUpload: (src: string) => {
            setIsLoading(true)
            return handleAssetUpload(src).finally(() => setIsLoading(false))
          },
        }
      },
    }
  },
)

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsImageControlTester, renderer: JsonFormsImageControl },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

const schema = Type.Object({
  image: Type.Optional(Type.String({ title: "Hero image", format: "image" })),
})

const renderImageControl = (data: { image?: string } = {}) => {
  const onChange = vi.fn<(data: { image?: string }) => void>()
  const { container } = render(
    <ThemeProvider theme={theme}>
      <JsonForms
        schema={schema}
        data={data}
        renderers={renderers}
        ajv={ajv}
        onChange={({ data }) => onChange(data as { image?: string })}
      />
    </ThemeProvider>,
  )
  const uploadImage = async () => {
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("File input not rendered")
    await userEvent.upload(
      input,
      new File(["png"], "hero.png", { type: "image/png" }),
    )
  }
  const savedImages = () => onChange.mock.calls.map(([data]) => data.image)
  return { uploadImage, savedImages }
}

describe("JsonFormsImageControl", () => {
  beforeEach(() => {
    handleAssetUpload.mockReset()
  })

  it("only saves the uploaded path once the CDN serves it", async () => {
    // Arrange
    let resolveCdnCheck = (_src: string) => {}
    handleAssetUpload.mockReturnValue(
      new Promise((resolve) => {
        resolveCdnCheck = resolve
      }),
    )
    const { uploadImage, savedImages } = renderImageControl()

    // Act: upload, leaving the CDN check pending
    await uploadImage()

    // Assert: the CDN check started but nothing is saved yet
    await waitFor(() =>
      expect(handleAssetUpload).toHaveBeenCalledExactlyOnceWith(UPLOADED_PATH),
    )
    // Outlast JsonForms' 10ms debounced onChange, as a real CDN check does, so
    // any interim write is emitted rather than merged into the final one
    await new Promise((resolve) => setTimeout(resolve, 50))
    // Nothing (not even an interim "") is saved while the CDN check runs
    expect(savedImages().every((image) => image === undefined)).toBe(true)

    // Act: the CDN starts serving the file
    resolveCdnCheck(UPLOADED_PATH)

    // Assert: only the final path is saved
    await waitFor(() => expect(savedImages().at(-1)).toBe(UPLOADED_PATH))
    expect(screen.getByText("hero.png")).toBeVisible()
    // Across the whole upload, the final path is the only value ever saved
    expect(savedImages().filter((image) => image !== undefined)).toEqual([
      UPLOADED_PATH,
    ])
  })

  it("shows an error and saves nothing when the CDN check fails", async () => {
    // Arrange
    handleAssetUpload.mockRejectedValue(new Error("Unable to read"))
    const { uploadImage, savedImages } = renderImageControl()

    // Act
    await uploadImage()

    // Assert
    expect(await screen.findByText("Failed to upload file")).toBeVisible()
    expect(savedImages().every((image) => image === undefined)).toBe(true)
  })

  it("clears the saved path when the image is removed", async () => {
    // Arrange
    const { savedImages } = renderImageControl({ image: UPLOADED_PATH })

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Remove file" }))

    // Assert
    await waitFor(() => expect(savedImages().at(-1)).toBeUndefined())
    expect(handleAssetUpload).not.toHaveBeenCalled()
  })
})
