import { TRPCError } from "@trpc/server"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

export const auditHandlers = {
  createExportRequest: {
    // Accepts the request and returns a Pending export row, the way the
    // service does on the happy path.
    success: () =>
      trpcMsw.audit.createExportRequest.mutation(
        ({ input: { siteId, month, reportType } }) => ({
          id: "audit-export-1",
          siteId,
          userId: "cljcnahpn0000xlwynuea40lv",
          month,
          reportType,
          status: "Pending",
          attempts: 0,
          errorMessage: null,
          objectKeys: [],
          createdAt: MOCK_STORY_DATE,
          updatedAt: MOCK_STORY_DATE,
        }),
      ),
    // Never resolves, so the submit button stays in its loading state — used
    // to demonstrate the in-flight UI.
    pending: () =>
      trpcMsw.audit.createExportRequest.mutation(
        () => new Promise(() => undefined),
      ),
    // An export for the same month + report type is already in flight.
    conflict: () =>
      trpcMsw.audit.createExportRequest.mutation(() => {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An export for this month and report type is already being generated",
        })
      }),
  },
}
