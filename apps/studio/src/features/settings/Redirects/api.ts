import { keepPreviousData } from "@tanstack/react-query"
import { atom, useAtom } from "jotai"
import { useMemo } from "react"
import { trpc } from "~/utils/trpc"

import type { RedirectRow } from "./types"

const localDraftsAtom = atom<Map<number, RedirectRow[]>>(new Map())
const pendingDeletesAtom = atom<Map<number, Set<string>>>(new Map())

export function useHasDirtyRedirects(siteId: number): boolean {
  const [localDraftsMap] = useAtom(localDraftsAtom)
  const [pendingDeletesMap] = useAtom(pendingDeletesAtom)
  const localDrafts = localDraftsMap.get(siteId) ?? []
  const pendingDeletes = pendingDeletesMap.get(siteId) ?? new Set<string>()
  return localDrafts.length > 0 || pendingDeletes.size > 0
}

export function useListRedirects(
  siteId: number,
  options?: {
    page?: number
    pageSize?: number
    sortBy?: "source" | "destination" | "createdAt"
    sortDirection?: "asc" | "desc"
  },
): {
  data: RedirectRow[]
  totalCount: number
  isLoading: boolean
  isFetching: boolean
} {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 25
  const sortBy = options?.sortBy ?? "createdAt"
  const sortDirection = options?.sortDirection ?? "desc"

  const {
    data: serverData,
    isLoading,
    isFetching,
  } = trpc.redirect.list.useQuery(
    { siteId, page, pageSize, sortBy, sortDirection },
    { placeholderData: keepPreviousData },
  )
  const [localDraftsMap] = useAtom(localDraftsAtom)
  const [pendingDeletesMap] = useAtom(pendingDeletesAtom)

  const localDrafts = localDraftsMap.get(siteId) ?? []
  const pendingDeletes = pendingDeletesMap.get(siteId) ?? new Set<string>()

  const merged = useMemo(() => {
    const serverRows: RedirectRow[] = (serverData?.items ?? []).map((row) => {
      if (pendingDeletes.has(row.id)) {
        return {
          ...row,
          status: "deleted" as const,
          hasUnpublishedChanges: true,
        }
      }
      return row
    })
    if (page === 1) {
      return [...localDrafts, ...serverRows]
    }
    return serverRows
  }, [serverData, localDrafts, pendingDeletes, page])

  return {
    data: merged,
    totalCount: serverData?.totalCount ?? 0,
    isLoading,
    isFetching,
  }
}

export function useCreateRedirect(): {
  mutate: (input: {
    siteId: number
    source: string
    destination: string
  }) => void
  isPending: boolean
} {
  const [, setDraftsMap] = useAtom(localDraftsAtom)
  const mutate = ({
    siteId,
    source,
    destination,
  }: {
    siteId: number
    source: string
    destination: string
  }) => {
    const newRow: RedirectRow = {
      id: `draft-${Date.now()}`,
      source,
      destination,
      publishedAt: null,
      status: "draft",
      hasUnpublishedChanges: true,
    }
    setDraftsMap((prev) => {
      const next = new Map(prev)
      const drafts = next.get(siteId) ?? []
      next.set(siteId, [newRow, ...drafts.filter((d) => d.source !== source)])
      return next
    })
  }
  return { mutate, isPending: false }
}

export function useDeleteRedirect(): {
  mutate: (input: { siteId: number; id: string }) => void
  isPending: boolean
} {
  const [, setDraftsMap] = useAtom(localDraftsAtom)
  const [, setPendingDeletesMap] = useAtom(pendingDeletesAtom)

  const mutate = ({ siteId, id }: { siteId: number; id: string }) => {
    if (id.startsWith("draft-")) {
      setDraftsMap((prev) => {
        const next = new Map(prev)
        const drafts = next.get(siteId) ?? []
        next.set(
          siteId,
          drafts.filter((row) => row.id !== id),
        )
        return next
      })
    } else {
      setPendingDeletesMap((prev) => {
        const next = new Map(prev)
        const deletes = next.get(siteId) ?? new Set<string>()
        next.set(siteId, new Set([...deletes, id]))
        return next
      })
    }
  }
  return { mutate, isPending: false }
}

export function usePublishRedirects(): {
  mutate: (siteId: number) => void
  isPending: boolean
  isError: boolean
} {
  const [localDraftsMap, setDraftsMap] = useAtom(localDraftsAtom)
  const [pendingDeletesMap, setPendingDeletesMap] = useAtom(pendingDeletesAtom)
  const utils = trpc.useUtils()

  const {
    mutate: serverPublish,
    isPending,
    isError,
  } = trpc.redirect.publish.useMutation()

  const mutate = (siteId: number) => {
    const localDrafts = localDraftsMap.get(siteId) ?? []
    const pendingDeletes = pendingDeletesMap.get(siteId) ?? new Set<string>()

    serverPublish(
      {
        siteId,
        creates: localDrafts.map(({ source, destination }) => ({
          source,
          destination,
        })),
        deletes: Array.from(pendingDeletes),
      },
      {
        onSuccess: () => {
          setDraftsMap((prev) => {
            const next = new Map(prev)
            next.delete(siteId)
            return next
          })
          setPendingDeletesMap((prev) => {
            const next = new Map(prev)
            next.delete(siteId)
            return next
          })
          void utils.redirect.list.invalidate()
        },
      },
    )
  }

  return { mutate, isPending, isError }
}
