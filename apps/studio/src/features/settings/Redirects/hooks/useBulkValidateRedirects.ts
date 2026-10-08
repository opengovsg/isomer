import { trpc } from "~/utils/trpc"

// Validates an uploaded CSV without writing. Uses the mutation (not a query) so
// the large CSV travels in the POST body — a query serialises its input into the
// request URL, which the server rejects near the size cap (connection reset).
// Read-only server-side; `validate` is a one-shot call returning the verdicts.
// The Process button's spinner is not driven off this mutation's `isPending`:
// the modal holds it for a minimum duration so a fast validation still reads as
// a run, so it owns that state itself.
export function useBulkValidateRedirects(siteId: number) {
  const { mutateAsync } = trpc.redirect.bulkValidate.useMutation()
  return {
    validate: (csv: string) => mutateAsync({ siteId, csv }),
  }
}
