import { atom, useAtom, useAtomValue } from "jotai"
import { useState } from "react"

import type { RedirectRow } from "./types"

const SEED_ROWS: RedirectRow[] = [
  {
    id: "1",
    source: "/test-url-9/very-long-url-that-truncates-hello",
    destination: "https://www.google.com",
    publishedAt: null,
    status: "draft",
    hasUnpublishedChanges: true,
  },
  {
    id: "2",
    source: "/resources/media-room/*",
    destination: "/newsroom",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "deleted",
    hasUnpublishedChanges: true,
  },
  {
    id: "3",
    source: "/resources/media-room/*",
    destination: "/newsroom",
    publishedAt: new Date(),
    status: "active",
    hasUnpublishedChanges: false,
  },
  {
    id: "4",
    source: "/resources/media-room/events/",
    destination: "/newsroom/announcements",
    publishedAt: new Date(),
    status: "active",
    hasUnpublishedChanges: false,
  },
  {
    id: "5",
    source: "/resources/media-room/2023/",
    destination: "/newsroom/updates",
    publishedAt: new Date(),
    status: "active",
    hasUnpublishedChanges: false,
  },
]

const redirectsAtom = atom<RedirectRow[]>(SEED_ROWS)

// TODO: Replace with trpc.redirect.list.useQuery when backend is ready (server/modules/redirect/redirect.router.ts)
export function useListRedirects(_siteId: number): {
  data: RedirectRow[]
  isLoading: boolean
} {
  const data = useAtomValue(redirectsAtom)
  return { data, isLoading: false }
}

// TODO: Replace with trpc.redirect.create.useMutation when backend is ready
export function useCreateRedirect(): {
  mutate: (input: {
    siteId: number
    source: string
    destination: string
  }) => void
  isPending: boolean
} {
  const [, setRows] = useAtom(redirectsAtom)
  const mutate = ({
    source,
    destination,
  }: {
    siteId: number
    source: string
    destination: string
  }) => {
    const newRow: RedirectRow = {
      id: String(Date.now()),
      source,
      destination,
      publishedAt: null,
      status: "draft",
      hasUnpublishedChanges: true,
    }
    setRows((prev) => [newRow, ...prev])
  }
  return { mutate, isPending: false }
}

// TODO: Replace with trpc.redirect.delete.useMutation when backend is ready
export function useDeleteRedirect(): {
  mutate: (input: { siteId: number; id: string }) => void
  isPending: boolean
} {
  const [, setRows] = useAtom(redirectsAtom)
  const mutate = ({ id }: { siteId: number; id: string }) => {
    setRows((prev) =>
      prev.flatMap((row) => {
        if (row.id !== id) return [row]
        if (row.status === "draft") return []
        return [
          { ...row, status: "deleted" as const, hasUnpublishedChanges: true },
        ]
      }),
    )
  }
  return { mutate, isPending: false }
}

// TODO: Replace with trpc.redirect.publish.useMutation when backend is ready
export function usePublishRedirects(): {
  mutate: (siteId: number) => void
  isPending: boolean
} {
  const [isPending, setIsPending] = useState(false)
  const [, setRows] = useAtom(redirectsAtom)
  const mutate = (_siteId: number) => {
    setIsPending(true)
    setTimeout(() => {
      setRows((prev) =>
        prev
          .filter((row) => row.status !== "deleted")
          .map((row) => ({
            ...row,
            status: "active" as const,
            hasUnpublishedChanges: false,
            publishedAt: row.publishedAt ?? new Date(),
          })),
      )
      setIsPending(false)
    }, 500)
  }
  return { mutate, isPending }
}
