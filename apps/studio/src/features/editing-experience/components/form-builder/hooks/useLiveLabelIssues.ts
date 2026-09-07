import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"

import { indicesWithBlankLabels } from "../renderers/controls/utils/indicesWithBlankLabels"
import { indicesWithDuplicateLabels } from "../renderers/controls/utils/indicesWithDuplicateLabels"

interface UseLiveLabelIssuesArgs {
  path: string
  editingIndex?: number | null
  editingDraftLabel?: string
}

export const useLiveLabelIssues = ({
  path,
  editingIndex = null,
  editingDraftLabel = "",
}: UseLiveLabelIssuesArgs): { blank: Set<number>; duplicate: Set<number> } => {
  const { core } = useJsonForms()
  // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
  // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
  const items = get(core?.data, path) as { label?: string }[] | undefined

  return useMemo(() => {
    const liveItems =
      editingIndex === null || !items
        ? items
        : items.map((item, i) =>
            i === editingIndex ? { ...item, label: editingDraftLabel } : item,
          )

    return {
      blank: indicesWithBlankLabels(liveItems),
      duplicate: indicesWithDuplicateLabels(liveItems),
    }
  }, [items, editingIndex, editingDraftLabel])
}
