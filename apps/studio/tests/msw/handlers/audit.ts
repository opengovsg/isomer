import type { IsoMonth } from "~/schemas/audit"
import { TRPCError } from "@trpc/server"
import { getMonthDateRange } from "~/server/modules/audit/auditLogExport.query"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

export const auditHandlers = {
  createExportRequest: {
    // Accepts the request and returns the inserted Pending rows, the way the
    // service does on the happy path: one row for Access/Activity, two for
    // Both — `Both` is input vocabulary only and fans out into two DB rows.
    success: () =>
      trpcMsw.audit.createExportRequest.mutation(
        ({ input: { siteId, month, reportType } }) => {
          // The service stores the picked month as a half-open SGT date range
          // string, `[YYYY-MM-DD,YYYY-MM-DD)`; mirror that in the mocked rows.
          // The mock sees the raw wire input (`z.input`, a plain string); on
          // the real server zod narrows it to `IsoMonth` before this point,
          // so mirror that narrowing with a cast.
          const auditLogDateRange = getMonthDateRange(
            month as IsoMonth,
            new Date(),
          )
          const dbReportTypes =
            reportType === "Both"
              ? (["Access", "Activity"] as const)
              : ([reportType] as const)
          return dbReportTypes.map((dbReportType, index) => ({
            id: `audit-export-${index + 1}`,
            // `siteId` input is `unknown` because the schema uses z.coerce.number();
            // it's a number at runtime, so coerce it for the mocked row.
            siteId: Number(siteId),
            userId: "cljcnahpn0000xlwynuea40lv",
            auditLogDateRange,
            reportType: dbReportType,
            status: "Pending",
            attempts: 0,
            errorMessage: null,
            objectKey: null,
            createdAt: MOCK_STORY_DATE,
            updatedAt: MOCK_STORY_DATE,
          }))
        },
      ),
    // Never resolves, so the submit button stays in its loading state — used
    // to demonstrate the in-flight UI.
    pending: () =>
      trpcMsw.audit.createExportRequest.mutation(
        () => new Promise(() => undefined),
      ),
    // An export for the same period + report type is already in flight.
    conflict: () =>
      trpcMsw.audit.createExportRequest.mutation(() => {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An export for this period and report type is already being generated",
        })
      }),
  },
}
