import { useJsonForms } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo } from "react"

import { indicesWithDuplicateLabels } from "../renderers/controls/utils/indicesWithDuplicateLabels"

export function useDuplicateLabels(path: string): Set<number> {
  const { core } = useJsonForms()
  const items = get(core?.data, path) as { label?: string }[] | undefined
  return useMemo(() => indicesWithDuplicateLabels(items), [items])
}
