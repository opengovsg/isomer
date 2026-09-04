import { describe, expect, it } from "vitest"

import type { IsoMonth } from "../audit"
import {
  AUDIT_LOG_EXPORT_MAX_MONTHS,
  AuditLogExportRequestedReportType,
  AuditLogExportScope,
  createAuditLogExportRequestSchema,
  createAuditLogExportRequestServerSchema,
  getCurrentSingaporeMonth,
  getEarliestExportableMonth,
} from "../audit"

// The schema now enforces the export window relative to "now", so the valid
// fixture month is the current Singapore month (always in-window) rather than a
// fixed literal that would fall out of the window as real time advances.
const CURRENT_MONTH = getCurrentSingaporeMonth()

const VALID_INPUT = {
  scope: AuditLogExportScope.Site,
  siteId: 1,
  month: CURRENT_MONTH,
  reportType: AuditLogExportRequestedReportType.Activity,
}

describe(createAuditLogExportRequestSchema, () => {

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

    // The future/past-year window is not enforced on the plain object schema
    // at all — only on `createAuditLogExportRequestServerSchema`, and only
    // for Activity exports (see that describe block below) — so a
    // well-formed but out-of-window month still parses here.
    it("should accept a well-formed month regardless of the export window", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        month: "2000-01",
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe("reportType", () => {

    it.each([
      AuditLogExportRequestedReportType.Access,
      AuditLogExportRequestedReportType.Activity,
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

    it("should reject 'Both' — the combined-request flow has been removed", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        reportType: "Both",
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("scope", () => {

    it.each([AuditLogExportScope.Site, AuditLogExportScope.AllSites])(
      "should accept the valid scope %s",
      (scope) => {
        // Arrange / Act
        const result = createAuditLogExportRequestSchema.safeParse({
          ...VALID_INPUT,
          scope,
        })

        // Assert
        expect(result.success).toBe(true)
      },
    )

    it("should reject an invalid scope", () => {
      // Arrange / Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...VALID_INPUT,
        scope: "everySite",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("accepts scope 'allSites' without a siteId on the plain object schema — client forms never need to supply one", () => {
      // Arrange
      const { siteId: _siteId, ...withoutSiteId } = VALID_INPUT

      // Act
      const result = createAuditLogExportRequestSchema.safeParse({
        ...withoutSiteId,
        scope: AuditLogExportScope.AllSites,
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe(createAuditLogExportRequestServerSchema, () => {

    it("accepts scope 'site' with a siteId", () => {
      // Arrange / Act
      const result =
        createAuditLogExportRequestServerSchema.safeParse(VALID_INPUT)

      // Assert
      expect(result.success).toBe(true)
    })

    it("rejects scope 'site' without a siteId", () => {
      // Arrange
      const { siteId: _siteId, ...withoutSiteId } = VALID_INPUT

      // Act
      const result =
        createAuditLogExportRequestServerSchema.safeParse(withoutSiteId)

      // Assert
      expect(result.success).toBe(false)
    })

    it("accepts scope 'allSites' without a siteId — resolved server-side from the caller's own Admin access", () => {
      // Arrange
      const { siteId: _siteId, ...withoutSiteId } = VALID_INPUT

      // Act
      const result = createAuditLogExportRequestServerSchema.safeParse({
        ...withoutSiteId,
        scope: AuditLogExportScope.AllSites,
      })

      // Assert
      expect(result.success).toBe(true)
    })

    // The future/past-year window is enforced here (not on the plain object
    // schema) and only for Activity — an Access export always uses the
    // server's current month regardless of what's submitted (see
    // `resolveAuditLogDateRange`), so bounding it would reject an otherwise-
    // fine request over a discarded value (e.g. browser clock skew nudging
    // it into "next month").
    describe("month window", () => {

      it("accepts the current Singapore month for an Activity export", () => {
        // Arrange / Act
        const result = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          month: CURRENT_MONTH,
        })

        // Assert
        expect(result.success).toBe(true)
      })

      it("accepts the earliest month in the window for an Activity export", () => {
        // Arrange / Act
        const result = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          month: getEarliestExportableMonth(CURRENT_MONTH),
        })

        // Assert
        expect(result.success).toBe(true)
      })

      it("rejects a future month for an Activity export", () => {
        // Arrange / Act
        const result = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          month: "2999-12",
        })

        // Assert
        expect(result.success).toBe(false)
      })

      it("rejects a month older than the 12-month window for an Activity export", () => {
        // Arrange / Act
        const result = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          month: "2000-01",
        })

        // Assert
        expect(result.success).toBe(false)
      })

      it("accepts a future or out-of-window month for an Access export", () => {
        // Arrange / Act
        const future = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          reportType: AuditLogExportRequestedReportType.Access,
          month: "2999-12",
        })
        const tooOld = createAuditLogExportRequestServerSchema.safeParse({
          ...VALID_INPUT,
          reportType: AuditLogExportRequestedReportType.Access,
          month: "2000-01",
        })

        // Assert
        expect(future.success).toBe(true)
        expect(tooOld.success).toBe(true)
      })
    })
  })

  describe(getEarliestExportableMonth, () => {

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
