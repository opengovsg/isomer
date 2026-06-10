import { trpc } from "~/utils/trpc"

// Only live redirects are returned — soft-deleted rows are never shown
export function useListRedirects(siteId: number) {
  const { data, isLoading } = trpc.redirect.list.useQuery({ siteId })
  return { data: data ?? [], isLoading }
}

// Creating a redirect publishes it to the site immediately. Creating a
// source that already has a live redirect is rejected with CONFLICT.
export function useCreateRedirect() {
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.redirect.create.useMutation({
    onSuccess: () => void utils.redirect.list.invalidate(),
  })
  return { mutate, isPending }
}

// Deleting a redirect removes it from the site immediately
export function useDeleteRedirect() {
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.redirect.delete.useMutation({
    onSuccess: () => void utils.redirect.list.invalidate(),
  })
  return { mutate, isPending }
}
