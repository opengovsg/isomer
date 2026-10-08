import { trpc } from "~/utils/trpc"

// Creating a redirect publishes it to the site immediately. Creating a
// source that already has a live redirect is rejected with CONFLICT.
export function useCreateRedirect() {
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.redirect.create.useMutation({
    // Invalidate the whole router so both list and count refetch
    onSuccess: () => void utils.redirect.invalidate(),
  })
  return { mutate, isPending }
}
