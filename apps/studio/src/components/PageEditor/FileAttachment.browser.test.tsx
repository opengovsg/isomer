import type * as DesignSystemReact from "@opengovsg/design-system-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { FileAttachment } from "./FileAttachment"

const toastMock = vi.hoisted(() => vi.fn())
vi.mock("@opengovsg/design-system-react", async (importOriginal) => {
  const actual = await importOriginal<typeof DesignSystemReact>()
  return {
    ...actual,
    useToast: () => toastMock,
    // Replaces the real drag-and-drop widget with a plain file input so the
    // test can drive FileAttachment's own upload/error logic directly,
    // without exercising react-dropzone's internals.
    Attachment: ({ onChange }: { onChange: (file?: File) => void }) => (
      <input
        aria-label="file-upload"
        type="file"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
    ),
  }
})

interface MutateOptions {
  onSuccess: (data: { path: string }) => void
  onError: (error: unknown) => void
}

const mutateMock = vi.hoisted(() =>
  vi.fn<(input: unknown, options: MutateOptions) => void>(),
)
vi.mock("~/hooks/useUploadAssetMutation", () => ({
  useUploadAssetMutation: () => ({ mutate: mutateMock }),
}))

const handleAssetUploadMock = vi.hoisted(() => vi.fn())
vi.mock(
  "~/features/editing-experience/components/form-builder/hooks/useAssetUpload",
  () => ({
    useAssetUpload: () => ({
      handleAssetUpload: handleAssetUploadMock,
      isLoading: false,
    }),
  }),
)

const SITE_ID = 1
const RESOURCE_ID = "resource-1"
const FILE = new File(["content"], "banner.png", { type: "image/png" })

const renderFileAttachment = () =>
  render(
    <ThemeProvider theme={theme}>
      <FileAttachment
        setHref={vi.fn()}
        siteId={SITE_ID}
        resourceId={RESOURCE_ID}
        maxSizeInBytes={5_000_000}
        acceptedFileTypes={{ ".png": "image/png" }}
      />
    </ThemeProvider>,
  )

const selectFile = () =>
  fireEvent.change(screen.getByLabelText("file-upload"), {
    target: { files: [FILE] },
  })

describe("FileAttachment", () => {
  beforeEach(() => {
    toastMock.mockClear()
    mutateMock.mockReset()
    handleAssetUploadMock.mockReset()
  })

  it("shows a generic error toast when the upload mutation fails", () => {
    // Arrange
    mutateMock.mockImplementation((_input, options) => {
      options.onError(new Error("upload failed"))
    })
    renderFileAttachment()

    // Act
    selectFile()

    // Assert
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Failed to upload file",
        description: "Please try again.",
        status: "error",
      }),
    )
    expect(handleAssetUploadMock).not.toHaveBeenCalled()
  })

  it("shows a generic error toast when the fetch-back fails", async () => {
    // Arrange
    handleAssetUploadMock.mockRejectedValue(new Error("fetch-back failed"))
    mutateMock.mockImplementation((_input, options) => {
      options.onSuccess({ path: "/path/to/banner.png" })
    })
    renderFileAttachment()

    // Act
    selectFile()

    // Assert
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to upload file",
          description: "Please try again.",
          status: "error",
        }),
      ),
    )
    expect(handleAssetUploadMock).toHaveBeenCalledWith("/path/to/banner.png", {
      siteId: SITE_ID,
      resourceId: RESOURCE_ID,
      fileExtension: ".png",
      fileSize: FILE.size,
    })
  })

  it("does not show a toast when the upload succeeds", async () => {
    // Arrange
    handleAssetUploadMock.mockResolvedValue("/cdn/path/to/banner.png")
    mutateMock.mockImplementation((_input, options) => {
      options.onSuccess({ path: "/path/to/banner.png" })
    })
    renderFileAttachment()

    // Act
    selectFile()

    // Assert
    await waitFor(() => expect(handleAssetUploadMock).toHaveBeenCalled())
    expect(toastMock).not.toHaveBeenCalled()
  })
})
