/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { DgsApiDatasetSearchResponseSuccess } from "../types"
import { fetchAllRecordsInChunks } from "../fetchAllRecordsInChunks"
import { useAllDgsRecords } from "../useAllDgsRecords"

vi.mock("../fetchAllRecordsInChunks", () => ({
  fetchAllRecordsInChunks: vi.fn(),
}))

const mockedFetchAll = vi.mocked(fetchAllRecordsInChunks)

type FetchResult = Awaited<ReturnType<typeof fetchAllRecordsInChunks>>

const makeRecord = (
  i: number,
): DgsApiDatasetSearchResponseSuccess["result"]["records"][number] => ({
  _id: i,
})

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe("useAllDgsRecords", () => {
  beforeEach(() => {
    mockedFetchAll.mockReset()
    ;(
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  it("should stay idle (isLoading=false) when disabled and not call the helper", async () => {
    // Arrange
    // (no mock setup — helper should never be called)

    // Act
    const { result } = renderHook(() =>
      useAllDgsRecords({
        resourceId: "resource-1",
        datasetSize: 1024,
        enabled: false,
      }),
    )
    await flushMicrotasks()

    // Assert
    expect(mockedFetchAll).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.records).toEqual([])
  })

  it("should fetch and populate records when enabled", async () => {
    // Arrange
    const records = [makeRecord(1), makeRecord(2)]
    mockedFetchAll.mockResolvedValueOnce({ records, total: 2 } as FetchResult)

    // Act
    const { result } = renderHook(() =>
      useAllDgsRecords({
        resourceId: "resource-1",
        datasetSize: 1024,
        enabled: true,
      }),
    )

    // Assert — initial pending state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.records).toEqual([])

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert — settled state
    expect(mockedFetchAll).toHaveBeenCalledTimes(1)
    expect(mockedFetchAll).toHaveBeenCalledWith({
      resourceId: "resource-1",
      datasetSize: 1024,
      filters: undefined,
      sort: undefined,
    })
    expect(result.current.isError).toBe(false)
    expect(result.current.records).toEqual(records)
  })

  it("should trigger a fetch on enabled transition false -> true", async () => {
    // Arrange
    const records = [makeRecord(7)]
    mockedFetchAll.mockResolvedValue({ records, total: 1 } as FetchResult)

    // Act — first render disabled
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useAllDgsRecords({
          resourceId: "resource-1",
          datasetSize: 1024,
          enabled,
        }),
      { initialProps: { enabled: false } },
    )
    await flushMicrotasks()

    // Assert — still idle
    expect(mockedFetchAll).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.records).toEqual([])

    // Act — flip to enabled
    rerender({ enabled: true })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(mockedFetchAll).toHaveBeenCalledTimes(1)
    expect(result.current.records).toEqual(records)
    expect(result.current.isError).toBe(false)
  })

  it("should ignore a late resolution after enabled flips true -> false", async () => {
    // Arrange — manually-controlled pending promise
    let resolveFetch!: (value: FetchResult) => void
    const pending = new Promise<FetchResult>((resolve) => {
      resolveFetch = resolve
    })
    mockedFetchAll.mockReturnValueOnce(pending)

    // Act — render enabled to kick off the in-flight fetch
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useAllDgsRecords({
          resourceId: "resource-1",
          datasetSize: 1024,
          enabled,
        }),
      { initialProps: { enabled: true } },
    )
    await flushMicrotasks()

    // Sanity — currently loading
    expect(mockedFetchAll).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(true)

    // Act — flip to disabled mid-flight (cancels) then resolve the late promise
    rerender({ enabled: false })
    await flushMicrotasks()

    await act(async () => {
      resolveFetch({
        records: [makeRecord(99)],
        total: 1,
      } as FetchResult)
      await Promise.resolve()
    })

    // Assert — late resolution did not write state
    expect(result.current.records).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it("should set isError=true when the helper rejects", async () => {
    // Arrange
    mockedFetchAll.mockRejectedValueOnce(new Error("boom"))

    // Act
    const { result } = renderHook(() =>
      useAllDgsRecords({
        resourceId: "resource-1",
        datasetSize: 1024,
        enabled: true,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(result.current.isError).toBe(true)
    expect(result.current.records).toEqual([])
  })

  it("should re-fire the fetch when a param (resourceId) changes", async () => {
    // Arrange
    mockedFetchAll.mockImplementation(({ resourceId }) =>
      Promise.resolve({
        records: [makeRecord(resourceId === "a" ? 1 : 2)],
        total: 1,
      } as FetchResult),
    )

    // Act — initial render
    const { result, rerender } = renderHook(
      ({ resourceId }: { resourceId: string }) =>
        useAllDgsRecords({
          resourceId,
          datasetSize: 1024,
          enabled: true,
        }),
      { initialProps: { resourceId: "a" } },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(mockedFetchAll).toHaveBeenCalledTimes(1)
    expect(mockedFetchAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ resourceId: "a" }),
    )
    expect(result.current.records).toEqual([makeRecord(1)])

    // Act — change resourceId
    rerender({ resourceId: "b" })

    await waitFor(() => {
      expect(mockedFetchAll).toHaveBeenCalledTimes(2)
    })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Assert
    expect(mockedFetchAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ resourceId: "b" }),
    )
    expect(result.current.records).toEqual([makeRecord(2)])
  })
})
