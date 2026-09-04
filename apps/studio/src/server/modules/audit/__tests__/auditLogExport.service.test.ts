import { describe, expect, it } from "vitest"
import { AUDIT_LOG_EXPORT_MAX_MONTHS } from "~/schemas/audit"

import { getMaxExportableMonths } from "../auditLogExport.service"

// Midday UTC lands safely inside the same SGT calendar day regardless of the
// +8 offset, so these fixtures don't need to reason about the UTC/SGT
// boundary — only the calendar month matters here.
describe(getMaxExportableMonths, () => {
  it("caps at the full window for a site older than the window", () => {
    expect(
      getMaxExportableMonths(
        new Date("2020-01-01T04:00:00Z"),
        new Date("2026-06-15T04:00:00Z"),
      ),
    ).toBe(AUDIT_LOG_EXPORT_MAX_MONTHS)
  })

  it("returns 1 for a site created in the current month", () => {
    expect(
      getMaxExportableMonths(
        new Date("2026-06-01T04:00:00Z"),
        new Date("2026-06-15T04:00:00Z"),
      ),
    ).toBe(1)
  })

  it("returns the exact month count for a site younger than the window", () => {
    // Created March 2026; current month June 2026 -> Mar, Apr, May, Jun = 4.
    expect(
      getMaxExportableMonths(
        new Date("2026-03-10T04:00:00Z"),
        new Date("2026-06-15T04:00:00Z"),
      ),
    ).toBe(4)
  })

  it("floors at 1 if siteCreatedAt is somehow after now", () => {
    expect(
      getMaxExportableMonths(
        new Date("2026-07-01T04:00:00Z"),
        new Date("2026-06-15T04:00:00Z"),
      ),
    ).toBe(1)
  })
})
