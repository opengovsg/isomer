import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/lib/fileUpload"
import { theme } from "~/theme"

import { FileAttachment } from "./FileAttachment"

const UPLOADED_PATH = "/1/uuid/report.pdf"

// Stand-in for the presign + PUT round trip, which this component only
// consumes through the mutation's onSuccess callback.
const uploadFile = vi.fn(
  (
    _input: { file: File },
    { onSuccess }: { onSuccess: (res: { path: string }) => void },
  ) => onSuccess({ path: UPLOADED_PATH }),
)
vi.mock("~/hooks/useUploadAssetMutation", () => ({
  useUploadAssetMutation: () => ({ mutate: uploadFile }),
}))

const renderFileAttachment = (
  props: Partial<Parameters<typeof FileAttachment>[0]> = {},
) => {
  const setHref = vi.fn()
  const onUploadedFile = vi.fn()
  const { container } = render(
    <ThemeProvider theme={theme}>
      <FileAttachment
        setHref={setHref}
        onUploadedFile={onUploadedFile}
        siteId={1}
        resourceId="1"
        maxSizeInBytes={5_000_000}
        acceptedFileTypes={FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
        {...props}
      />
    </ThemeProvider>,
  )
  const getFileInput = () => {
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("File input not rendered")
    return input
  }
  return { setHref, onUploadedFile, getFileInput }
}

describe("FileAttachment", () => {
  beforeEach(() => {
    uploadFile.mockClear()
  })

  it("reports the uploaded path once, straight after the upload", async () => {
    // Arrange
    const { setHref, onUploadedFile, getFileInput } = renderFileAttachment()
    const file = new File(["%PDF"], "report.pdf", { type: "application/pdf" })

    // Act
    await userEvent.upload(getFileInput(), file)

    // Assert
    await waitFor(() => expect(setHref).toHaveBeenCalled())
    // Never an interim "" while the upload is in flight
    expect(setHref.mock.calls).toEqual([[UPLOADED_PATH]])
    // The browser hands the component a copy of the File, so match by name
    expect(onUploadedFile).toHaveBeenCalledOnce()
    expect(onUploadedFile.mock.calls[0]?.[0]).toHaveProperty("name", file.name)
  })

  it("asks for confirmation before uploading a risky file", async () => {
    // Arrange
    const { setHref, getFileInput } = renderFileAttachment({
      enableRiskyFileWarning: true,
    })

    // Act: pick a risky file
    await userEvent.upload(
      getFileInput(),
      new File(["xlsx"], "budget.xlsx", {
        type: FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING[".xlsx"],
      }),
    )

    // Assert: nothing is uploaded until the risk is acknowledged
    const confirmButton = await screen.findByRole("button", {
      name: "Upload file",
    })
    expect(uploadFile).not.toHaveBeenCalled()

    // Act: acknowledge the risk and confirm. The checkbox input is visually
    // hidden, so tick it via its label
    await userEvent.click(screen.getByText(/accept the risks/i))
    await userEvent.click(confirmButton)

    // Assert: the file is uploaded
    await waitFor(() => expect(setHref).toHaveBeenCalledWith(UPLOADED_PATH))
    expect(uploadFile).toHaveBeenCalledOnce()
  })
})
