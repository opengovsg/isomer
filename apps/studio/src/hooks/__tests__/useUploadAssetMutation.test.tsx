// @vitest-environment jsdom
import type { PropsWithChildren } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUploadAssetMutation } from "../useUploadAssetMutation"

const reportClientError = vi.hoisted(() => vi.fn())
vi.mock("~/lib/datadogError", () => ({ reportClientError }))

const performUpload = vi.hoisted(() => vi.fn())
vi.mock("~/lib/storage/client", () => ({ performUpload }))

const getPresignedPutUrl = vi.hoisted(() => vi.fn())
const uploadSvg = vi.hoisted(() => vi.fn())
vi.mock("~/utils/trpc", () => ({
  trpc: {
    asset: {
      getPresignedPutUrl: {
        useMutation: () => ({ mutateAsync: getPresignedPutUrl }),
      },
      uploadSvg: { useMutation: () => ({ mutateAsync: uploadSvg }) },
    },
  },
}))

const SITE_ID = 1
const RESOURCE_ID = "resource-1"
const FILE = new File(["content"], "banner.png", { type: "image/png" })

const wrapper = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useUploadAssetMutation", () => {
  beforeEach(() => {
    reportClientError.mockClear()
    performUpload.mockClear()
    getPresignedPutUrl.mockClear()
    uploadSvg.mockClear()
  })

  it("reports the error to Datadog when the presign call fails", async () => {
    // Arrange
    const error = new Error("presign failed")
    getPresignedPutUrl.mockRejectedValueOnce(error)
    const { result } = renderHook(
      () =>
        useUploadAssetMutation({ siteId: SITE_ID, resourceId: RESOURCE_ID }),
      { wrapper },
    )

    // Act
    act(() => result.current.mutate({ file: FILE }))

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(reportClientError).toHaveBeenCalledWith(error, {
      feature: "asset-upload",
      siteId: SITE_ID,
      resourceId: RESOURCE_ID,
      fileExtension: ".png",
      fileSize: FILE.size,
    })
  })

  it("reports the error to Datadog when the S3 upload fails", async () => {
    // Arrange
    const error = new Error("upload failed")
    getPresignedPutUrl.mockResolvedValueOnce({
      fileKey: "key",
      uploadConfig: {},
    })
    performUpload.mockRejectedValueOnce(error)
    const { result } = renderHook(
      () =>
        useUploadAssetMutation({ siteId: SITE_ID, resourceId: RESOURCE_ID }),
      { wrapper },
    )

    // Act
    act(() => result.current.mutate({ file: FILE }))

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(reportClientError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ feature: "asset-upload" }),
    )
  })

  it("does not report anything when the upload succeeds", async () => {
    // Arrange
    getPresignedPutUrl.mockResolvedValueOnce({
      fileKey: "key",
      uploadConfig: {},
    })
    performUpload.mockResolvedValueOnce("/key")
    const { result } = renderHook(
      () =>
        useUploadAssetMutation({ siteId: SITE_ID, resourceId: RESOURCE_ID }),
      { wrapper },
    )

    // Act
    act(() => result.current.mutate({ file: FILE }))

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(reportClientError).not.toHaveBeenCalled()
  })

  it("still reports after the consuming component unmounts", async () => {
    // Arrange
    let rejectUpload!: (error: unknown) => void
    getPresignedPutUrl.mockResolvedValueOnce({
      fileKey: "key",
      uploadConfig: {},
    })
    performUpload.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectUpload = reject
        }),
    )
    const { result, unmount } = renderHook(
      () =>
        useUploadAssetMutation({ siteId: SITE_ID, resourceId: RESOURCE_ID }),
      { wrapper },
    )

    // Act
    act(() => result.current.mutate({ file: FILE }))
    await waitFor(() => expect(performUpload).toHaveBeenCalled())
    unmount()
    const error = new Error("upload failed after unmount")
    rejectUpload(error)
    // Flush the mutationFn's rejection before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Assert
    expect(reportClientError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ feature: "asset-upload" }),
    )
  })
})
