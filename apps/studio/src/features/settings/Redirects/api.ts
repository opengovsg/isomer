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

// Resolves stored [resource:...] destinations to the page's current permalink
// for display. Kept separate from the list query so the read path stays plain;
// the table calls this once with the references on the visible page.
export function useResolveRedirectReferences(
  siteId: number,
  references: string[],
) {
  const { data } = trpc.redirect.resolveReferences.useQuery(
    { siteId, references },
    {
      enabled: references.length > 0,
      // Keep the previous resolutions visible while a new page loads
      placeholderData: keepPreviousData,
    },
  )
  return { data: data ?? [] }
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

// Validates an uploaded CSV without writing. Uses the mutation (not a query) so
// the large CSV travels in the POST body — a query serialises its input into the
// request URL, which the server rejects near the size cap (connection reset).
// Read-only server-side; mutateAsync just gives us a one-shot call returning the
// verdicts.
export function useBulkValidateRedirects(siteId: number) {
  const { mutateAsync } = trpc.redirect.bulkValidate.useMutation()
  return (csv: string) => mutateAsync({ siteId, csv })
}

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
