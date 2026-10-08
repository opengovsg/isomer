import { keepPreviousData } from "@tanstack/react-query"
import { trpc } from "~/utils/trpc"

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
