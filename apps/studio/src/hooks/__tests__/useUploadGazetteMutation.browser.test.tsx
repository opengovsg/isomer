import type { PropsWithChildren } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useUploadGazetteMutation } from "../useUploadGazetteMutation"

const { getPresignedPutUrl, performUpload } = vi.hoisted(() => ({
  getPresignedPutUrl: vi.fn(),
  performUpload: vi.fn().mockResolvedValue("/2026/Notices/Public/notice.pdf"),
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    gazette: {
      getPresignedPutUrl: {
        useMutation: () => ({ mutateAsync: getPresignedPutUrl }),
      },
    },
  },
}))

vi.mock("~/lib/storage/client", () => ({ performUpload }))

const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe("useUploadGazetteMutation", () => {
  it("forwards the signed tagging so the PUT can send it", async () => {
    // Arrange
    getPresignedPutUrl.mockResolvedValueOnce({
      fileKey: "2026/Notices/Public/notice.pdf",
      presignedPutUrl: "https://bucket.example.com/notice.pdf",
      contentType: "application/pdf",
      contentDisposition: "inline; filename=notice.pdf",
      tagging: "scheduledAt=1700000000000",
    })
    const { result } = renderHook(
      () => useUploadGazetteMutation({ siteId: 1, resourceId: "1" }),
      { wrapper },
    )

    // Act
    await result.current.mutateAsync({
      file: new File(["%PDF"], "notice.pdf"),
      scheduledAt: new Date(1700000000000),
      year: 2026,
      category: "Notices",
      subcategory: "Public",
    })

    // Assert
    expect(performUpload).toHaveBeenCalledWith(
      expect.any(File),
      "2026/Notices/Public/notice.pdf",
      expect.objectContaining({ tagging: "scheduledAt=1700000000000" }),
    )
  })
})
