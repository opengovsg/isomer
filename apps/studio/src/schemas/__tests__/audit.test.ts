import { describe, expect, it } from "vitest"

import type { IsoMonth } from "../audit"
import {
  AUDIT_LOG_EXPORT_MAX_MONTHS,
  AuditLogExportRequestedReportType,
  createAuditLogExportRequestSchema,
  getCurrentSingaporeMonth,
  getEarliestExportableMonth,
} from "../audit"

// The schema now enforces the export window relative to "now", so the valid
// fixture month is the current Singapore month (always in-window) rather than a
// fixed literal that would fall out of the window as real time advances.
const CURRENT_MONTH = getCurrentSingaporeMonth()

const VALID_INPUT = {
  siteId: 1,
  month: CURRENT_MONTH,
  reportType: AuditLogExportRequestedReportType.Both,
}

describe("createAuditLogExportRequestSchema", () => {
  it("should parse a known-good input", () => {
    // Arrange / Act
    const result = createAuditLogExportRequestSchema.safeParse(VALID_INPUT)

    // Assert
    expect(result.success).toBe(true)
  })

  describe("month", () => {
    it.each(["2026-13", "2026-1", "26-01", "not-a-month", ""])(
      "should reject the invalid month %j",
      (month) => {
        // Arrange / Act
        const result = createAuditLogExportRequestSchema.safeParse({
          ...VALID_INPUT,
          month,
        })

        // Assert
        expect(result.success).toBe(false)
      },
    )

    it("should accept the current Singapore month (in window)", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        month: CURRENT_MONTH,
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should accept the earliest month in the window", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        month: getEarliestExportableMonth(CURRENT_MONTH),
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject a month in the future", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        month: "2999-12",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject a month older than the 12-month window", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        month: "2000-01",
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("reportType", () => {
    it.each([
      AuditLogExportRequestedReportType.Access,
      AuditLogExportRequestedReportType.Activity,
      AuditLogExportRequestedReportType.Both,
    ])("should accept the valid report type %s", (reportType) => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        reportType,
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject an invalid report type", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        reportType: "users",
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("getEarliestExportableMonth", () => {
    it("should return the month 11 months before the current month", () => {
      // 12 months inclusive of the current month.
      expect(getEarliestExportableMonth("2026-06")).toBe("2025-07")
    })

    // `it.each` widens tuple literals to `string`, so type the cases
    // explicitly to satisfy the `IsoMonth` parameter.
    it.each<[IsoMonth, IsoMonth]>([
      ["2026-01", "2025-02"],
      ["2026-12", "2026-01"],
      ["2026-11", "2025-12"],
    ])("should roll the year over correctly: %s -> %s", (current, earliest) => {
      expect(getEarliestExportableMonth(current)).toBe(earliest)
    })

    it("should span exactly AUDIT_LOG_EXPORT_MAX_MONTHS months inclusive", () => {
      expect(AUDIT_LOG_EXPORT_MAX_MONTHS).toBe(12)
      // current month + earliest month, plus the 10 in between, is 12 months.
      expect(getEarliestExportableMonth("2026-06")).toBe("2025-07")
    })
  })

  describe("siteId", () => {
    it("should accept a plain number siteId", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId: 1,
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.siteId).toBe(1)
    })

    it("should coerce a numeric-string siteId (e.g. from a native form input)", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId: "1",
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.siteId).toBe(1)
    })

    // JS numeric coercion turns true -> 1, [1] -> 1, and "" / [] -> 0. The
    // union guard must reject these non-ID JSON values rather than silently
    // treating them as a valid site.
    it.each([
      ["boolean true", true],
      ["single-element array", [1]],
      ["empty object", {}],
      ["non-numeric string", "abc"],
    ])("should reject a non-ID siteId (%s)", (_label, siteId) => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId,
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject a non-positive siteId", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId: 0,
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject a negative siteId", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId: -1,
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject a non-integer siteId", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        siteId: 1.5,
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })
})
