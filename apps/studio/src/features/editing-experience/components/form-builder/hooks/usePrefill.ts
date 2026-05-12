import { useJsonForms } from "@jsonforms/react"
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type RouterOutput, trpc } from "~/utils/trpc"

import { AUTOPOPULATED_FIELDS } from "../constants"

// Placeholder values from DEFAULT_BLOCKS that should be treated as empty
const PLACEHOLDER_VALUES = new Set(
  DEFAULT_BLOCKS.infocards.cards.flatMap((card) => [
    card.title,
    card.imageUrl,
    card.imageAlt,
  ]),
)

const isEmptyOrPlaceholder = (value: string | undefined): boolean => {
  if (!value?.trim()) return true
  return PLACEHOLDER_VALUES.has(value)
}

interface UsePrefillParams {
  data: unknown
  path: string
}

export function usePrefillForCards({ data, path }: UsePrefillParams) {
  const { siteId } = useQueryParse(siteSchema)
  const ctx = useJsonForms()
  const utils = trpc.useUtils()
  const [prefillData, setPrefillData] = useState<
    RouterOutput["page"]["getPrefill"] | null
  >(null)

  const resourceId = getResourceIdFromReferenceLink(data as string)

  // NOTE: Omit last item because that points to this link control
  const parts = path.split(".").slice(0, -1)
  const basePath = parts.join(".")
  const parent = parts[0]

  const shouldFetch = useMemo(() => {
    if (!resourceId || parent !== "cards") return false
    return (
      data &&
      AUTOPOPULATED_FIELDS.some((field) =>
        isEmptyOrPlaceholder(
          get(ctx.core?.data, `${basePath}.${field}`) as string | undefined,
        ),
      )
    )
  }, [resourceId, parent, ctx.core?.data, basePath, data])

  useEffect(() => {
    if (!shouldFetch || !resourceId) return

    void utils.page.getPrefill
      .fetch({ resourceId, siteId: Number(siteId) })
      .then(setPrefillData)
      .catch(() => {
        // Silently fail if the linked page cannot be fetched
      })
  }, [shouldFetch, resourceId, siteId, utils.page.getPrefill])

  if (!shouldFetch || !prefillData) return undefined

  const needsConfirmation = !AUTOPOPULATED_FIELDS.every((field) =>
    isEmptyOrPlaceholder(
      get(ctx.core?.data, `${basePath}.${field}`) as string | undefined,
    ),
  )

  return { needsConfirmation, basePath, data: prefillData }
}
