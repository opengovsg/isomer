import { describe, expect, it } from "vitest"

import {
  buildGazetteSearchRecords,
  getContentDispositionForTitle,
} from "../gazette"

describe(getContentDispositionForTitle, () => {
  it("should use the title as filename, keeping the key's extension", () => {
    const result = getContentDispositionForTitle(
      "Government Gazette No. 1",
      "2024/category/sub/file.pdf",
    )
    expect(result).toBe(`inline; filename="Government Gazette No. 1.pdf"`)
  })

  it("should encode non-latin1 titles via RFC 5987 with a latin1 fallback", () => {
    const result = getContentDispositionForTitle("测试文件", "1/abc/doc.pdf")
    expect(result).toBe(
      `inline; filename="????.pdf"; filename*=UTF-8''%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.pdf`,
    )
  })

  it("should omit the extension when the key has none", () => {
    const result = getContentDispositionForTitle("My Title", "1/abc/blob")
    expect(result).toBe(`inline; filename="My Title"`)
  })

  it("should preserve titles with path separators instead of truncating them", () => {
    // content-disposition runs path.basename internally, which would truncate
    // "A/B\\C" to "C"; path separators must be replaced before it is called.
    const result = getContentDispositionForTitle("A/B\\C", "1/abc/doc.pdf")
    expect(result).toBe(`inline; filename=A-B-C.pdf`)
  })

  it("should emit valid headers for titles with RFC 5987 attr-chars ' ( ) *", () => {
    // encodeURIComponent leaves ' ( ) * unescaped, which is invalid inside a
    // filename* ext-value; the content-disposition package keeps them in a
    // quoted filename= instead, which is well-formed.
    const result = getContentDispositionForTitle(
      "O'Brien (No. 1)*",
      "1/abc/doc.pdf",
    )
    expect(result).toBe(`inline; filename="O'Brien (No. 1)*.pdf"`)
  })
})

describe(buildGazetteSearchRecords, () => {
  // A fixed date in SGT (UTC+8): 2026-04-30T12:00:00 SGT = 2026-04-30T04:00:00Z
  const SGT_DATE = new Date("2026-04-30T04:00:00.000Z")

  const BASE_PARAMS = {
    parsedText: "Hello world",
    objectGroup: "2026/Government Gazette/Public/notice-123.pdf",
    title: "Government Gazette Notice 123",
    category: "Government Gazette",
    subCategory: "Public",
    fileUrl:
      "https://gazettes.example/2026/Government Gazette/Public/notice-123.pdf",
    scheduledAt: SGT_DATE,
  }

  it("returns an empty array when parsedText is empty", () => {
    // Arrange / Act
    const result = buildGazetteSearchRecords({
      ...BASE_PARAMS,
      parsedText: "",
    })

    // Assert
    expect(result).toStrictEqual([])
  })

  it("returns a single record for short text", () => {
    // Arrange / Act
    const result = buildGazetteSearchRecords(BASE_PARAMS)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]!.objectID).toBe(
      "2026/Government Gazette/Public/notice-123.pdf-text-0",
    )
    expect(result[0]!.text).toBe("Hello world")
  })

  it("produces multiple records with sequential objectIDs for text > 7000 chars", () => {
    // Arrange — build text that exceeds one chunk boundary
    const chunk1 = "a".repeat(7000)
    const chunk2 = "b".repeat(100)
    const longText = chunk1 + " " + chunk2

    // Act
    const result = buildGazetteSearchRecords({
      ...BASE_PARAMS,
      parsedText: longText,
    })

    // Assert
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]!.objectID).toBe(
      "2026/Government Gazette/Public/notice-123.pdf-text-0",
    )
    expect(result[1]!.objectID).toBe(
      "2026/Government Gazette/Public/notice-123.pdf-text-1",
    )
  })

  it("sets objectGroup correctly on every record", () => {
    // Arrange / Act
    const result = buildGazetteSearchRecords(BASE_PARAMS)

    // Assert
    expect(result[0]!.objectGroup).toBe(
      "2026/Government Gazette/Public/notice-123.pdf",
    )
  })

  it("derives SG-local date fields correctly from scheduledAt", () => {
    // Arrange / Act
    // SGT_DATE is 2026-04-30 12:00 SGT, so: DD=30, MM=04, YYYY=2026
    const result = buildGazetteSearchRecords(BASE_PARAMS)
    const record = result[0]!

    // Assert
    expect(record.publishDate).toBe("30/04/2026")
    expect(record.publishYear).toBe(2026)
    expect(record.publishMonth).toBe(4)
    expect(record.publishDay).toBe(30)
    expect(record.publishTimestamp).toBe(SGT_DATE.getTime())
  })

  it("pads notificationNum to 10 chars for lexiNotificationNum when present", () => {
    // Arrange / Act
    const result = buildGazetteSearchRecords({
      ...BASE_PARAMS,
      notificationNum: "123",
    })

    // Assert
    expect(result[0]!.notificationNum).toBe("123")
    expect(result[0]!.lexiNotificationNum).toBe("0000000123")
  })

  it("omits lexiNotificationNum when notificationNum is absent (advertisement case)", () => {
    // Arrange / Act — no notificationNum in BASE_PARAMS
    const result = buildGazetteSearchRecords(BASE_PARAMS)

    // Assert
    expect(result[0]!.notificationNum).toBeUndefined()
    expect(result[0]!.lexiNotificationNum).toBeUndefined()
  })

  it("passes subCategory through unchanged", () => {
    // Arrange / Act
    const result = buildGazetteSearchRecords({
      ...BASE_PARAMS,
      subCategory: "Extraordinary",
    })

    // Assert
    expect(result[0]!.subCategory).toBe("Extraordinary")
  })

  it("zero-pads single-digit day and month in publishDate", () => {
    // Arrange — 5 January 2026 in SGT (UTC+8); UTC instant is 2026-01-04T16:00:00Z
    const singleDigitDate = new Date("2026-01-05T00:00:00+08:00")

    // Act
    const result = buildGazetteSearchRecords({
      ...BASE_PARAMS,
      scheduledAt: singleDigitDate,
    })
    const record = result[0]!

    // Assert
    expect(record.publishDate).toBe("05/01/2026")
    expect(record.publishDay).toBe(5)
    expect(record.publishMonth).toBe(1)
    expect(record.publishYear).toBe(2026)
  })
})
