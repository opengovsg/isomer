import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

export const auditHandlers = {
  // How many months back the export picker may offer for this site. Defaults
  // to the standard full window; stories that want to demonstrate a young
  // site can override with a smaller `maxMonths`.
  getExportWindow: {
    default: (maxMonths = 12) =>
      trpcMsw.audit.getExportWindow.query(() => ({ maxMonths })),
  },
  createExportRequest: {
    // Accepts the request and returns the inserted Pending row, the way the
    // service does on the happy path.
    success: () =>
      trpcMsw.audit.createExportRequest.mutation(
        ({ input: { siteId, reportType } }) => {
          // The service stores the picked month as a half-open SGT date range
          // string, `[YYYY-MM-DD,YYYY-MM-DD)`. The UI never reads this value,
          // so a fixed literal is enough for the mocked row — avoids pulling
          // the server DB query module into the Storybook browser bundle.
          const auditLogDateRange = "[2024-09-01,2024-09-13)"
          return [
            {
              id: "audit-export-1",
              // `siteId` input is `unknown` because the schema uses z.coerce.number();
              // it's a number at runtime, so coerce it for the mocked row.
              // Falls back to a fixed id for the `allSites` scope, where the
              // request never carries one — no story currently exercises it.
              siteId: siteId === undefined ? 1 : Number(siteId),
              userId: "cljcnahpn0000xlwynuea40lv",
              auditLogDateRange,
              reportType,
              status: "Pending",
              attempts: 0,
              errorMessage: null,
              objectKey: null,
              completedAt: null,
              createdAt: MOCK_STORY_DATE,
              updatedAt: MOCK_STORY_DATE,
            },
          ]
        },
      ),
    // Never resolves, so the submit button stays in its loading state — used
    // to demonstrate the in-flight UI.
    // NOTE: there is deliberately no failure handler for a duplicate request:
    // asking twice can no longer fail — the service accepts duplicates
    // idempotently (ADR docs/adr/0005).
    pending: () =>
      trpcMsw.audit.createExportRequest.mutation(
        () => new Promise(() => undefined),
      ),
  },
}
