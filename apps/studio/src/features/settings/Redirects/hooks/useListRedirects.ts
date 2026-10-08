import type { ListRedirectsInput } from "~/schemas/redirect"
import { keepPreviousData } from "@tanstack/react-query"
import { trpc } from "~/utils/trpc"

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
