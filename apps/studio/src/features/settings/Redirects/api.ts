import type { ListRedirectsInput } from "~/schemas/redirect"
import { keepPreviousData } from "@tanstack/react-query"
import { trpc } from "~/utils/trpc"

export const REDIRECTS_PAGE_SIZE = 25

// Only live redirects are returned — soft-deleted rows are never shown.
// Rows are paginated and sorted server-side, so the table passes its page
// and sort state straight through.
export function useListRedirects(
  siteId: number,
  params: Omit<ListRedirectsInput, "siteId">,
) {
  const { data, isLoading } = trpc.redirect.list.useQuery(
    { siteId, ...params },
    // Required for table to show previous data while fetching next page
    { placeholderData: keepPreviousData },
  )
  return { data: data ?? [], isLoading }
}

// Total number of live redirects, used to derive the page count
export function useCountRedirects(siteId: number) {
  const { data, isLoading } = trpc.redirect.count.useQuery({ siteId })
  return { data: data ?? 0, isLoading }
}

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

// Deleting a redirect removes it from the site immediately
export function useDeleteRedirect() {
  const utils = trpc.useUtils()
  const { mutate, isPending } = trpc.redirect.delete.useMutation({
    onSuccess: () => void utils.redirect.invalidate(),
  })
  return { mutate, isPending }
}
