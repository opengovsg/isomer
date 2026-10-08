import { trpc } from "~/utils/trpc"

// Publishes a validated batch. Invalidates the router only when a publish
// actually happened (ok === true); a re-validation failure returns ok: false
// with fresh row verdicts and writes nothing.
export function useBulkCreateRedirects() {
  const utils = trpc.useUtils()
  const { mutateAsync, isPending } = trpc.redirect.bulkCreate.useMutation({
    onSuccess: (result) => {
      if (result.ok) void utils.redirect.invalidate()
    },
  })
  return { mutateAsync, isPending }
}
