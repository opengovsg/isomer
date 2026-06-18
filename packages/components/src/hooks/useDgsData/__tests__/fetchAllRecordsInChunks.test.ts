import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { DgsApiDatasetSearchResponseSuccess } from "../types"
import { fetchAllRecordsInChunks } from "../fetchAllRecordsInChunks"
import { fetchDataFromDgsApiDataset } from "../fetchDataFromDgsApi"

vi.mock("../fetchDataFromDgsApi", () => ({
  fetchDataFromDgsApiDataset: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchDataFromDgsApiDataset)

const ONE_MB = 1024 * 1024

const makeRecord = (i: number): Record<string, string | number> => ({
  _id: i,
  name: `row-${i}`,
})

const makeResponse = (
  records: Record<string, string | number>[],
  total: number,
): DgsApiDatasetSearchResponseSuccess => ({
  success: true,
  result: { records, total },
})

describe("fetchAllRecordsInChunks", () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should only fire the probe when total is 0", async () => {
    // Arrange
    mockedFetch.mockResolvedValueOnce(makeResponse([], 0))

    // Act
    const result = await fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: 10 * ONE_MB,
    })

    // Assert
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ records: [], total: 0 })
  })

  it("should issue probe + single data chunk when dataset is small", async () => {
    // Arrange
    const total = 50
    const records = Array.from({ length: total }, (_, i) => makeRecord(i))
    mockedFetch.mockResolvedValueOnce(makeResponse([records[0]!], total))
    mockedFetch.mockResolvedValueOnce(makeResponse(records, total))

    // Act
    const result = await fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: ONE_MB, // 1MB ≤ 4MB → baseChunks=1, no buffer → 1 chunk
    })

    // Assert
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    // Probe call
    expect(mockedFetch).toHaveBeenNthCalledWith(1, {
      resourceId: "resource-1",
      filters: undefined,
      sort: "_id",
      limit: 1,
    })
    // Single data chunk
    expect(mockedFetch).toHaveBeenNthCalledWith(2, {
      resourceId: "resource-1",
      filters: undefined,
      sort: "_id",
      limit: total,
      offset: 0,
    })
    expect(result.total).toBe(total)
    expect(result.records).toHaveLength(total)
  })

  it("should issue probe + multiple parallel data chunks for a larger dataset", async () => {
    // Arrange
    const total = 1000
    // datasetSize = 11MB → numChunks = ceil(11/4) + 1 = 4 (with buffer)
    // limitPerChunk = ceil(1000/4) = 250
    const datasetSize = 11 * ONE_MB
    const expectedLimit = 250

    const chunk0 = [makeRecord(0), makeRecord(1)]
    const chunk1 = [makeRecord(100), makeRecord(101)]
    const chunk2 = [makeRecord(200), makeRecord(201)]
    const chunk3 = [makeRecord(300), makeRecord(301)]

    mockedFetch.mockImplementation((params) => {
      // Probe call has no offset and limit=1
      if (params.offset === undefined) {
        return Promise.resolve(makeResponse([makeRecord(-1)], total))
      }
      if (params.offset === 0)
        return Promise.resolve(makeResponse(chunk0, total))
      if (params.offset === expectedLimit)
        return Promise.resolve(makeResponse(chunk1, total))
      if (params.offset === 2 * expectedLimit)
        return Promise.resolve(makeResponse(chunk2, total))
      if (params.offset === 3 * expectedLimit)
        return Promise.resolve(makeResponse(chunk3, total))
      return Promise.reject(new Error(`unexpected offset ${params.offset}`))
    })

    // Act
    const result = await fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize,
    })

    // Assert
    expect(mockedFetch).toHaveBeenCalledTimes(5) // 1 probe + 4 chunks

    // Probe was first
    expect(mockedFetch).toHaveBeenNthCalledWith(1, {
      resourceId: "resource-1",
      filters: undefined,
      sort: "_id",
      limit: 1,
    })

    // Four parallel chunk calls with the expected offsets
    const chunkCalls = mockedFetch.mock.calls.slice(1).map(([params]) => params)
    const offsets = chunkCalls.map((c) => c.offset).sort((a, b) => a! - b!)
    expect(offsets).toEqual([
      0,
      expectedLimit,
      2 * expectedLimit,
      3 * expectedLimit,
    ])
    chunkCalls.forEach((c) => {
      expect(c.limit).toBe(expectedLimit)
      expect(c.resourceId).toBe("resource-1")
      expect(c.sort).toBe("_id")
    })

    // Records are concatenated in chunk order (offset 0 first, then 250, 500, 750)
    expect(result.total).toBe(total)
    expect(result.records).toEqual([...chunk0, ...chunk1, ...chunk2, ...chunk3])
  })

  it("should default sort to '_id' when caller does not provide one", async () => {
    // Arrange
    mockedFetch.mockResolvedValue(makeResponse([makeRecord(0)], 1))

    // Act
    await fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: ONE_MB,
    })

    // Assert
    for (const [params] of mockedFetch.mock.calls) {
      expect(params.sort).toBe("_id")
    }
  })

  it("should preserve caller's sort when provided", async () => {
    // Arrange
    mockedFetch.mockResolvedValue(makeResponse([makeRecord(0)], 1))
    const callerSort = "name desc"

    // Act
    await fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: ONE_MB,
      sort: callerSort,
    })

    // Assert
    for (const [params] of mockedFetch.mock.calls) {
      expect(params.sort).toBe(callerSort)
    }
  })

  it("should retry a failing chunk and eventually succeed", async () => {
    // Arrange
    vi.useFakeTimers()
    const total = 5
    const records = Array.from({ length: total }, (_, i) => makeRecord(i))

    // Calls: 1 probe (succeeds), then chunk attempts 1 & 2 fail, attempt 3 succeeds
    mockedFetch.mockResolvedValueOnce(makeResponse([records[0]!], total)) // probe
    mockedFetch.mockRejectedValueOnce(new Error("transient 1"))
    mockedFetch.mockRejectedValueOnce(new Error("transient 2"))
    mockedFetch.mockResolvedValueOnce(makeResponse(records, total))

    // Act
    const promise = fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: ONE_MB,
    })

    // Drain microtasks + advance through both backoff delays (300ms, 800ms)
    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(800)
    const result = await promise

    // Assert
    expect(mockedFetch).toHaveBeenCalledTimes(4) // probe + 3 chunk attempts
    expect(result.total).toBe(total)
    expect(result.records).toEqual(records)
  })

  it("should surface the error once retries are exhausted", async () => {
    // Arrange
    vi.useFakeTimers()
    const total = 5

    // Probe succeeds, then chunk fails 3 times (1 initial + 2 retries)
    mockedFetch.mockResolvedValueOnce(makeResponse([makeRecord(0)], total))
    const finalError = new Error("permanent failure")
    mockedFetch.mockRejectedValueOnce(new Error("fail 1"))
    mockedFetch.mockRejectedValueOnce(new Error("fail 2"))
    mockedFetch.mockRejectedValueOnce(finalError)

    // Act
    const promise = fetchAllRecordsInChunks({
      resourceId: "resource-1",
      datasetSize: ONE_MB,
    })
    // Swallow the rejection on the promise itself so unhandled-rejection
    // tracking doesn't fail the test before we await it.
    const expectation = expect(promise).rejects.toThrow("permanent failure")

    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(800)
    await expectation

    // Assert
    expect(mockedFetch).toHaveBeenCalledTimes(4) // probe + 3 chunk attempts
  })
})
