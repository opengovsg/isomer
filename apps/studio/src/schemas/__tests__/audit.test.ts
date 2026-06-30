import { describe, expect, it } from "vitest"
import { AuditLogExportReportType } from "~prisma/generated/generatedEnums"

import {
  AUDIT_LOG_EXPORT_MAX_MONTHS,
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
  reportType: AuditLogExportReportType.Both,
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
      AuditLogExportReportType.Access,
      AuditLogExportReportType.Activity,
      AuditLogExportReportType.Both,
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

    it.each([
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
