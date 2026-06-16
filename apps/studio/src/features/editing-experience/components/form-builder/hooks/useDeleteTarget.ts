import type { ArrayLayoutProps } from "@jsonforms/core"
import { useState } from "react"

interface UseDeleteTargetArgs<T> {
  path: string
  removeItems: ArrayLayoutProps["removeItems"]
  isRemoveItemDisabled: boolean
  resolveTarget: (index: number) => T
}

export function useDeleteTarget<T extends { label: string }>({
  path,
  removeItems,
  isRemoveItemDisabled,
  resolveTarget,
}: UseDeleteTargetArgs<T>) {
  const [target, setTarget] = useState<(T & { index: number }) | null>(null)

  const openDeleteModal = (index: number) =>
    setTarget({ ...resolveTarget(index), index })

  const closeDeleteModal = () => setTarget(null)

  const handleConfirmDelete = () => {
    if (!target || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [target.index])()
    setTarget(null)
  }

  return { target, openDeleteModal, closeDeleteModal, handleConfirmDelete }
}
