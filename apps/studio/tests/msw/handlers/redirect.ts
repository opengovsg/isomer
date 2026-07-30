import { TRPCError } from "@trpc/server"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

const DEFAULT_REDIRECT_ITEMS = [
  {
    id: "1",
    source: "/old-about-us",
    destination: "/about",
    publishedAt: MOCK_STORY_DATE,
  },
  {
    id: "2",
    source: "/press-releases",
    destination: "https://www.example.gov.sg/newsroom",
    publishedAt: MOCK_STORY_DATE,
  },
]

export const redirectHandlers = {
  list: {
    default: () =>
      trpcMsw.redirect.list.query(({ input: { limit = 25, offset = 0 } }) =>
        DEFAULT_REDIRECT_ITEMS.slice(offset, offset + limit),
      ),
    empty: () => trpcMsw.redirect.list.query(() => []),
  },
  count: {
    default: () =>
      trpcMsw.redirect.count.query(() => DEFAULT_REDIRECT_ITEMS.length),
    empty: () => trpcMsw.redirect.count.query(() => 0),
  },
  create: {
    // The source already has a live redirect — surfaced inline on the source.
    alreadyExists: () =>
      trpcMsw.redirect.create.mutation(() => {
        throw new TRPCError({ code: "CONFLICT" })
      }),
    // The redirect would point straight back — surfaced inline on the
    // destination. redirect.create throws UNPROCESSABLE_CONTENT for a loop.
    loop: () =>
      trpcMsw.redirect.create.mutation(() => {
        throw new TRPCError({ code: "UNPROCESSABLE_CONTENT" })
      }),
  },
  bulkValidate: {
    // Every row passes — drives the ready-to-publish preview.
    allValid: () =>
      trpcMsw.redirect.bulkValidate.mutation(() => ({
        fileError: null,
        rows: [
          {
            rowNumber: 2,
            source: "/old-one",
            destination: "/new-one",
            error: null,
          },
          {
            rowNumber: 3,
            source: "/old-two",
            destination: "https://www.example.gov.sg",
            error: null,
          },
        ],
        validCount: 2,
        errorCount: 0,
      })),
    // A mix of a failing and a passing row — drives the errors screen.
    withErrors: () =>
      trpcMsw.redirect.bulkValidate.mutation(() => ({
        fileError: null,
        rows: [
          {
            rowNumber: 2,
            source: "/loop-a",
            destination: "/loop-b",
            error: "This will trap visitors in a never-ending loop.",
          },
          { rowNumber: 3, source: "/ok", destination: "/fine", error: null },
        ],
        validCount: 1,
        errorCount: 1,
      })),
  },
  bulkCreate: {
    success: (publishedCount = 2) =>
      trpcMsw.redirect.bulkCreate.mutation(() => ({
        ok: true as const,
        publishedCount,
      })),
  },
  getBySource: {
    // The URL is not a redirect source — no settings warning shown.
    none: () => trpcMsw.redirect.getBySource.query(() => null),
    // The URL is already a redirect source pointing elsewhere — drives the
    // settings-modal warning.
    existing: () =>
      trpcMsw.redirect.getBySource.query(() => ({
        destination: "/somewhere-else",
        destinationResourceId: null,
      })),
    // The URL redirects back to this page (destinationResourceId === the page
    // being edited); the modal suppresses the warning since saving auto-clears it.
    toResource: (resourceId = 1) =>
      trpcMsw.redirect.getBySource.query(() => ({
        destination: "/this-page",
        destinationResourceId: resourceId,
      })),
  },
  countByDestinationResource: {
    // No redirects point here — no delete-modal warning shown.
    none: () => trpcMsw.redirect.countByDestinationResource.query(() => 0),
    // Some redirects point here — drives the delete-modal warning.
    some: () => trpcMsw.redirect.countByDestinationResource.query(() => 3),
  },
}
