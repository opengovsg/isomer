import { atom, useAtom, useAtomValue } from "jotai"

import type { RedirectRow } from "./types"

const SEED_ROWS: RedirectRow[] = [
  {
    id: "1",
    source: "/test-url-9/very-long-url-that-truncates-hello",
    destination: "https://www.google.com",
    publishedAt: new Date(),
  },
  {
    id: "2",
    source: "/resources/media-room/*",
    destination: "/newsroom",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    source: "/resources/media-room/events/",
    destination: "/newsroom/announcements",
    publishedAt: new Date(),
  },
  {
    id: "4",
    source: "/resources/media-room/2023/",
    destination: "/newsroom/updates",
    publishedAt: new Date(),
  },
]

const redirectsAtom = atom<RedirectRow[]>(SEED_ROWS)

// TODO: Replace with trpc.redirect.list.useQuery when backend is ready
// (server/modules/redirect/redirect.router.ts). The endpoint must exclude
// soft-deleted redirects — only live rows are ever shown.
export function useListRedirects(_siteId: number): {
  data: RedirectRow[]
  isLoading: boolean
} {
  const data = useAtomValue(redirectsAtom)
  return { data, isLoading: false }
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
  const [rows, setRows] = useAtom(redirectsAtom)
  const mutate = (
    {
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
    if (rows.some((row) => row.source === source)) {
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
    setRows((prev) => [newRow, ...prev])
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
  const [, setRows] = useAtom(redirectsAtom)
  const mutate = (
    { id }: { siteId: number; id: string },
    callbacks?: { onSuccess?: () => void },
  ) => {
    setRows((prev) => prev.filter((row) => row.id !== id))
    callbacks?.onSuccess?.()
  }
  return { mutate, isPending: false }
}
