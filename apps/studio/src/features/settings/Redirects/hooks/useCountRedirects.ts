import { trpc } from "~/utils/trpc"

// Total number of live redirects, used to derive the page count
export function useCountRedirects(siteId: number) {
  const { data, isLoading } = trpc.redirect.count.useQuery({ siteId })
  return { data: data ?? 0, isLoading }
}
