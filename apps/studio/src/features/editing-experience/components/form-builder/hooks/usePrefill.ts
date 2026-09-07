import type { RouterOutput } from "~/utils/trpc"
import { useJsonForms } from "@jsonforms/react"
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

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
  if (!hasNonEmptyString(value?.trim())) {
    return true
  }
  return PLACEHOLDER_VALUES.has(value)
}

interface UsePrefillParams {
  data: unknown
  path: string
}

export const usePrefillForCards = ({ data, path }: UsePrefillParams) => {
  const { siteId } = useQueryParse(siteSchema)
  const ctx = useJsonForms()
  const utils = trpc.useUtils()
  const [prefillData, setPrefillData] = useState<
    RouterOutput["page"]["getPrefill"] | null
  >(null)

  // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
  const resourceId = getResourceIdFromReferenceLink(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- JSON Forms data is a reference link string
    data as string,
  )

  // NOTE: Omit last item because that points to this link control
  const parts = path.split(".").slice(0, -1)
  const basePath = parts.join(".")
  // oxlint-disable-next-line eslint/prefer-destructuring -- core cleanup deferred
  const parent = parts[0]

  const shouldFetch = useMemo(() => {
    if (!hasNonEmptyString(resourceId) || parent !== "cards") {
      return false
    }
    return (
      // oxlint-disable-next-line typescript/strict-boolean-expressions -- core cleanup deferred
      data &&
      AUTOPOPULATED_FIELDS.some((field) =>
        isEmptyOrPlaceholder(
          // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
          // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
          get(ctx.core?.data, `${basePath}.${field}`) as string | undefined,
        ),
      )
    )
  }, [resourceId, parent, ctx.core?.data, basePath, data])

  useEffect(() => {
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- core cleanup deferred
    if (!shouldFetch || !resourceId) {
      return
    }

    void utils.page.getPrefill
      .fetch({ resourceId, siteId: Number(siteId) })
      // oxlint-disable-next-line promise/prefer-await-to-then -- core cleanup deferred
      .then(setPrefillData)
      // oxlint-disable-next-line promise/prefer-await-to-then -- core cleanup deferred
      .catch(() => {
        // Silently fail if the linked page cannot be fetched
      })
  }, [shouldFetch, resourceId, siteId, utils.page.getPrefill])

  // oxlint-disable-next-line typescript/strict-boolean-expressions -- core cleanup deferred
  if (!shouldFetch || !prefillData) {
    return
  }

  const needsConfirmation = !AUTOPOPULATED_FIELDS.every((field) =>
    isEmptyOrPlaceholder(
      // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
      // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
      get(ctx.core?.data, `${basePath}.${field}`) as string | undefined,
    ),
  )

  // oxlint-disable-next-line typescript/consistent-return -- core cleanup deferred
  return { basePath, data: prefillData, needsConfirmation }
}
