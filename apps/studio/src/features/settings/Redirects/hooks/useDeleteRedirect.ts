import { trpc } from "~/utils/trpc"

// Deleting a redirect removes it from the site immediately
export function useDeleteRedirect() {
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.redirect.delete.useMutation({
    onSuccess: () => void utils.redirect.invalidate(),
  })
  return { mutate, isPending }
}
