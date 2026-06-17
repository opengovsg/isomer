import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchDgsMetadata } from "../fetchDgsMetadata"

describe("fetchDgsMetadata", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("throws when the metadata API responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    await expect(fetchDgsMetadata({ resourceId: "d_test" })).rejects.toThrow(
      "HTTP error! status: 500",
    )
  })

  it("returns parsed metadata for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              name: "Valid dataset",
              format: "CSV",
              datasetSize: 200 * 1024,
              columnMetadata: { metaMapping: {} },
            },
          }),
      }),
    )

    await expect(fetchDgsMetadata({ resourceId: "d_test" })).resolves.toEqual({
      name: "Valid dataset",
      format: "CSV",
      size: 200 * 1024,
      columnMetadata: [],
    })
  })
})
