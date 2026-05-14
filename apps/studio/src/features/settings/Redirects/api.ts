import { atom, useAtom } from "jotai"
import { useMemo } from "react"
import { trpc } from "~/utils/trpc"

import type { RedirectRow } from "./types"

const localDraftsAtom = atom<RedirectRow[]>([])
const pendingDeletesAtom = atom<Set<string>>(new Set<string>())

export function useListRedirects(siteId: number): {
  data: RedirectRow[]
  isLoading: boolean
} {
  const { data: serverData, isLoading } = trpc.redirect.list.useQuery({
    siteId,
    pageSize: 100,
  })
  const [localDrafts] = useAtom(localDraftsAtom)
  const [pendingDeletes] = useAtom(pendingDeletesAtom)

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
    return [...localDrafts, ...serverRows]
  }, [serverData, localDrafts, pendingDeletes])

  return { data: merged, isLoading }
}

export function useCreateRedirect(): {
  mutate: (input: {
    siteId: number
    source: string
    destination: string
  }) => void
  isPending: boolean
} {
  const [, setDrafts] = useAtom(localDraftsAtom)
  const mutate = ({
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
    setDrafts((prev) => [newRow, ...prev])
  }
  return { mutate, isPending: false }
}

export function useDeleteRedirect(): {
  mutate: (input: { siteId: number; id: string }) => void
  isPending: boolean
} {
  const [, setDrafts] = useAtom(localDraftsAtom)
  const [, setPendingDeletes] = useAtom(pendingDeletesAtom)

  const mutate = ({ id }: { siteId: number; id: string }) => {
    if (id.startsWith("draft-")) {
      setDrafts((prev) => prev.filter((row) => row.id !== id))
    } else {
      setPendingDeletes((prev: Set<string>) => new Set([...prev, id]))
    }
  }
  return { mutate, isPending: false }
}

export function usePublishRedirects(): {
  mutate: (siteId: number) => void
  isPending: boolean
} {
  const [localDrafts, setDrafts] = useAtom(localDraftsAtom)
  const [pendingDeletes, setPendingDeletes] = useAtom(pendingDeletesAtom)
  const utils = trpc.useUtils()

  const { mutate: serverPublish, isPending } =
    trpc.redirect.publish.useMutation({
      onSuccess: async () => {
        setDrafts([])
        setPendingDeletes(new Set())
        await utils.redirect.list.invalidate()
      },
    })

  const mutate = (siteId: number) => {
    serverPublish({
      siteId,
      creates: localDrafts.map(({ source, destination }) => ({
        source,
        destination,
      })),
      deletes: Array.from(pendingDeletes),
    })
  }

  return { mutate, isPending }
}
