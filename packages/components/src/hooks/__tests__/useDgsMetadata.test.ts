/* @vitest-environment jsdom */

import type { FetchDgsMetadataOutput } from "~/utils/dgs/fetchDgsMetadata"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fetchDgsMetadata } from "~/utils/dgs/fetchDgsMetadata"

import { useDgsMetadata } from "../useDgsMetadata"

vi.mock("~/utils/dgs/fetchDgsMetadata", () => ({
  fetchDgsMetadata: vi.fn(),
}))

const mockedFetchDgsMetadata = vi.mocked(fetchDgsMetadata)

const makeMetadata = (): FetchDgsMetadataOutput => ({
  name: "Test dataset",
  format: "CSV",
  size: 1024,
  columnMetadata: [["col_a", "Column A"]],
})

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe("useDgsMetadata", () => {
  beforeEach(() => {
    mockedFetchDgsMetadata.mockReset()
    ;(
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  it("should stay idle when disabled and not call fetchDgsMetadata", async () => {
    // Act
    const { result } = renderHook(() =>
      useDgsMetadata({
        resourceId: "resource-1",
        enabled: false,
      }),
    )
    await flushMicrotasks()

    // Assert
    expect(mockedFetchDgsMetadata).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.metadata).toBeUndefined()
  })

  it("should start loading immediately when enabled on mount", () => {
    // Arrange
    mockedFetchDgsMetadata.mockResolvedValueOnce(makeMetadata())

    // Act
    const { result } = renderHook(() =>
      useDgsMetadata({
        resourceId: "resource-1",
        enabled: true,
      }),
    )

    // Assert
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.metadata).toBeUndefined()
  })

  it("should set isLoading true immediately on enabled transition false -> true", async () => {
    // Arrange
    mockedFetchDgsMetadata.mockResolvedValue(makeMetadata())

    // Act
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDgsMetadata({
          resourceId: "resource-1",
          enabled,
        }),
      { initialProps: { enabled: false } },
    )
    await flushMicrotasks()

    // Assert
    expect(result.current.isLoading).toBe(false)

    // Act
    rerender({ enabled: true })

    // Assert
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(mockedFetchDgsMetadata).toHaveBeenCalledTimes(1)
    expect(result.current.metadata).toEqual(makeMetadata())
    expect(result.current.isError).toBe(false)
  })

  it("should fetch and populate metadata when enabled", async () => {
    // Arrange
    mockedFetchDgsMetadata.mockResolvedValueOnce(makeMetadata())

    // Act
    const { result } = renderHook(() =>
      useDgsMetadata({
        resourceId: "resource-1",
      }),
    )

    // Assert
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(mockedFetchDgsMetadata).toHaveBeenCalledWith({
      resourceId: "resource-1",
    })
    expect(result.current.metadata).toEqual(makeMetadata())
    expect(result.current.isError).toBe(false)
  })

  it("should reset state when enabled flips true -> false", async () => {
    // Arrange
    mockedFetchDgsMetadata.mockResolvedValueOnce(makeMetadata())

    // Act
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDgsMetadata({
          resourceId: "resource-1",
          enabled,
        }),
      { initialProps: { enabled: true } },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(result.current.metadata).toEqual(makeMetadata())

    // Act
    rerender({ enabled: false })
    await flushMicrotasks()

    // Assert
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.metadata).toBeUndefined()
    expect(mockedFetchDgsMetadata).toHaveBeenCalledTimes(1)
  })

  it("should ignore a late resolution after enabled flips true -> false", async () => {
    // Arrange
    let resolveFetch!: (value: FetchDgsMetadataOutput) => void
    const pending = new Promise<FetchDgsMetadataOutput>((resolve) => {
      resolveFetch = resolve
    })
    mockedFetchDgsMetadata.mockReturnValueOnce(pending)

    // Act
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useDgsMetadata({
          resourceId: "resource-1",
          enabled,
        }),
      { initialProps: { enabled: true } },
    )
    await flushMicrotasks()

    // Assert
    expect(result.current.isLoading).toBe(true)

    // Act
    rerender({ enabled: false })
    await flushMicrotasks()

    // Assert
    expect(result.current.isLoading).toBe(false)
    expect(result.current.metadata).toBeUndefined()

    // Act
    await act(async () => {
      resolveFetch(makeMetadata())
      await Promise.resolve()
    })

    // Assert
    expect(result.current.metadata).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it("should ignore a late resolution after resourceId changes", async () => {
    // Arrange
    let resolveFirstFetch!: (value: FetchDgsMetadataOutput) => void
    const firstPending = new Promise<FetchDgsMetadataOutput>((resolve) => {
      resolveFirstFetch = resolve
    })
    mockedFetchDgsMetadata
      .mockReturnValueOnce(firstPending)
      .mockResolvedValueOnce({
        ...makeMetadata(),
        name: "Second dataset",
      })

    // Act
    const { result, rerender } = renderHook(
      ({ resourceId }: { resourceId: string }) =>
        useDgsMetadata({
          resourceId,
        }),
      { initialProps: { resourceId: "resource-a" } },
    )
    await flushMicrotasks()

    rerender({ resourceId: "resource-b" })

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Act
    await act(async () => {
      resolveFirstFetch(makeMetadata())
      await Promise.resolve()
    })

    // Assert
    expect(result.current.metadata?.name).toBe("Second dataset")
    expect(mockedFetchDgsMetadata).toHaveBeenCalledTimes(2)
  })

  it("should re-fetch when resourceId changes", async () => {
    // Arrange
    mockedFetchDgsMetadata.mockImplementation(({ resourceId }) =>
      Promise.resolve({
        ...makeMetadata(),
        name: resourceId,
      }),
    )

    // Act
    const { result, rerender } = renderHook(
      ({ resourceId }: { resourceId: string }) =>
        useDgsMetadata({
          resourceId,
        }),
      { initialProps: { resourceId: "resource-a" } },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(result.current.metadata?.name).toBe("resource-a")

    // Act
    rerender({ resourceId: "resource-b" })

    // Assert
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(mockedFetchDgsMetadata).toHaveBeenCalledTimes(2)
    expect(result.current.metadata?.name).toBe("resource-b")
  })

  it("should set isError=true when fetchDgsMetadata throws", async () => {
    // Arrange
    mockedFetchDgsMetadata.mockRejectedValueOnce(new Error("boom"))

    // Act
    const { result } = renderHook(() =>
      useDgsMetadata({
        resourceId: "resource-1",
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(result.current.isError).toBe(true)
    expect(result.current.metadata).toBeUndefined()
  })
})
