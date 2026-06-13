import { atom, useAtom, useAtomValue } from "jotai"
import { useMemo } from "react"

import type { RedirectRow, RedirectSortField } from "./types"

export const REDIRECTS_PAGE_SIZE = 25

const HOUR_MS = 60 * 60 * 1000
const now = Date.now()

const SEED_ROWS: RedirectRow[] = [
  {
    id: "1",
    source: "/test-url-9/very-long-url-that-truncates-hello",
    destination: "https://www.google.com",
    publishedAt: new Date(now),
  },
  {
    id: "2",
    source: "/resources/media-room/*",
    destination: "/newsroom",
    publishedAt: new Date(now - 48 * HOUR_MS),
  },
  {
    id: "3",
    source: "/resources/media-room/events/",
    destination: "/newsroom/announcements",
    publishedAt: new Date(now - 1 * HOUR_MS),
  },
  {
    id: "4",
    source: "/resources/media-room/2023/",
    destination: "/newsroom/updates",
    publishedAt: new Date(now - 2 * HOUR_MS),
  },
  // Bulk rows so the mock data spans multiple pages
  ...Array.from({ length: 56 }, (_, index) => ({
    id: String(index + 5),
    source: `/archive/news-${index + 1}`,
    destination: `/newsroom/archive/${index + 1}`,
    publishedAt: new Date(now - (index + 3) * 12 * HOUR_MS),
  })),
]

// Mock state is keyed by siteId so adds/deletes on one site don't leak into
// another during manual testing. Every site starts from the same seed rows.
const redirectsAtom = atom<Record<number, RedirectRow[]>>({})

const getSiteRows = (
  allRows: Record<number, RedirectRow[]>,
  siteId: number,
): RedirectRow[] => allRows[siteId] ?? SEED_ROWS

export interface ListRedirectsParams {
  limit: number
  offset: number
  sortBy: RedirectSortField
  sortDirection: "asc" | "desc"
}

const compareRows =
  (sortBy: RedirectSortField, sortDirection: "asc" | "desc") =>
  (a: RedirectRow, b: RedirectRow): number => {
    const order = sortDirection === "asc" ? 1 : -1
    if (sortBy === "publishedAt") {
      return order * (a.publishedAt.getTime() - b.publishedAt.getTime())
    }
    return order * a[sortBy].localeCompare(b[sortBy])
  }

// TODO: Replace with trpc.redirect.list.useQuery when backend is ready
// (server/modules/redirect/redirect.router.ts). The endpoint paginates with
// limit/offset, sorts server-side (sorting within a single page would be
// misleading), and must exclude soft-deleted redirects — only live rows are
// ever shown.
export function useListRedirects(
  siteId: number,
  { limit, offset, sortBy, sortDirection }: ListRedirectsParams,
): {
  data: RedirectRow[]
  isLoading: boolean
} {
  const allRows = useAtomValue(redirectsAtom)
  const data = useMemo(
    () =>
      [...getSiteRows(allRows, siteId)]
        .sort(compareRows(sortBy, sortDirection))
        .slice(offset, offset + limit),
    [allRows, siteId, limit, offset, sortBy, sortDirection],
  )
  return { data, isLoading: false }
}

// TODO: Replace with trpc.redirect.count.useQuery when backend is ready. The
// endpoint counts live (non-soft-deleted) redirects for the site, used to
// derive the page count.
export function useCountRedirects(siteId: number): {
  data: number
  isLoading: boolean
} {
  const allRows = useAtomValue(redirectsAtom)
  return { data: getSiteRows(allRows, siteId).length, isLoading: false }
}

// TODO: Replace with trpc.redirect.create.useMutation when backend is ready.
// The endpoint creates the redirect and immediately triggers a site publish —
// there is no separate publish step. Creating a source that already has a
// live redirect is rejected with CONFLICT; soft-deleted sources don't count
// and are revived instead.
export function useCreateRedirect(): {
  mutate: (
    input: { siteId: number; source: string; destination: string },
    callbacks?: {
      onSuccess?: () => void
      onError?: (error: { message: string }) => void
    },
  ) => void
  isPending: boolean
} {
  const [allRows, setAllRows] = useAtom(redirectsAtom)
  const mutate = (
    {
      siteId,
      source,
      destination,
    }: {
      siteId: number
      source: string
      destination: string
    },
    callbacks?: {
      onSuccess?: () => void
      onError?: (error: { message: string }) => void
    },
  ) => {
    if (getSiteRows(allRows, siteId).some((row) => row.source === source)) {
      callbacks?.onError?.({
        message: `A redirect already exists for ${source}`,
      })
      return
    }
    const newRow: RedirectRow = {
      id: String(Date.now()),
      source,
      destination,
      publishedAt: new Date(),
    }
    setAllRows((prev) => ({
      ...prev,
      [siteId]: [newRow, ...getSiteRows(prev, siteId)],
    }))
    callbacks?.onSuccess?.()
  }
  return { mutate, isPending: false }
}

// TODO: Replace with trpc.redirect.delete.useMutation when backend is ready.
// The endpoint soft-deletes the redirect and immediately triggers a site
// publish — there is no separate publish step.
export function useDeleteRedirect(): {
  mutate: (
    input: { siteId: number; id: string },
    callbacks?: { onSuccess?: () => void },
  ) => void
  isPending: boolean
} {
  const [, setAllRows] = useAtom(redirectsAtom)
  const mutate = (
    { siteId, id }: { siteId: number; id: string },
    callbacks?: { onSuccess?: () => void },
  ) => {
    setAllRows((prev) => ({
      ...prev,
      [siteId]: getSiteRows(prev, siteId).filter((row) => row.id !== id),
    }))
    callbacks?.onSuccess?.()
  }
  return { mutate, isPending: false }
}
