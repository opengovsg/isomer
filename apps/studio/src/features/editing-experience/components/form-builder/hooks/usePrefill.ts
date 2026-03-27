import { useEffect, useState } from "react"
import { useJsonForms } from "@jsonforms/react"
import { useToast } from "@opengovsg/design-system-react"
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import get from "lodash/get"

import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

const AUTOPOPULATED_FIELDS = ["title", "description", "imageUrl"] as const

// Placeholder values from DEFAULT_BLOCKS that should be treated as empty
const PLACEHOLDER_VALUES = new Set(
  DEFAULT_BLOCKS.infocards.cards.flatMap((card) => [card.title, card.imageUrl]),
)

const isEmptyOrPlaceholder = (value: string | undefined): boolean => {
  if (!value?.trim()) return true
  return PLACEHOLDER_VALUES.has(value)
}

interface UsePrefillParams {
  data: unknown
  path: string
  handleChange: (path: string, value: unknown) => void
}

export function usePrefillForCards({
  data,
  path,
  handleChange,
}: UsePrefillParams) {
  const [lastFetched, setLastFetched] = useState<string>("")
  const { siteId } = useQueryParse(siteSchema)
  const ctx = useJsonForms()
  const utils = trpc.useUtils()
  const toast = useToast()

  useEffect(() => {
    // NOTE: split from the check below
    // to avoid slow rendering cycles
    if (lastFetched === data) return

    const resourceId = getResourceIdFromReferenceLink(data as string)
    if (!resourceId) return

    // NOTE: Omit last item because that points to this link control
    const parts = path.split(".").slice(0, -1)
    const basePath = parts.join(".")
    const parent = parts[0]

    // NOTE: should only  prefill for cards
    if (parent !== "cards") return

    // Check if any field is empty or contains a placeholder value before fetching
    const hasEmptyOrPlaceholderField = AUTOPOPULATED_FIELDS.some((field) =>
      isEmptyOrPlaceholder(
        get(ctx.core?.data, `${basePath}.${field}`) as string | undefined,
      ),
    )

    if (!hasEmptyOrPlaceholderField) return

    // Fetch the linked page data and auto-fill empty or placeholder fields
    utils.page.getPrefill
      .fetch({ resourceId, siteId: Number(siteId) })
      .then(({ title, description, thumbnail }) => {
        // NOTE: setting this up here means that if we fail the fetch,
        // we will abort silently and never retry
        setLastFetched(data as string)

        if (
          isEmptyOrPlaceholder(
            get(ctx.core?.data, `${basePath}.title`) as string | undefined,
          ) &&
          title
        ) {
          handleChange(`${basePath}.title`, title)
        }

        if (
          isEmptyOrPlaceholder(
            get(ctx.core?.data, `${basePath}.description`) as
              | string
              | undefined,
          ) &&
          description
        ) {
          handleChange(`${basePath}.description`, description)
        }

        if (
          isEmptyOrPlaceholder(
            get(ctx.core?.data, `${basePath}.imageUrl`) as string | undefined,
          ) &&
          thumbnail
        ) {
          handleChange(`${basePath}.imageUrl`, thumbnail)
        }

        toast({
          title:
            "Some details of the page were copied over. You can modify them.",
          status: "success",
          ...BRIEF_TOAST_SETTINGS,
        })
      })
      .catch((err) => {
        // Silently fail if the linked page cannot be fetched
        console.log(err)
      })
  }, [data, lastFetched, siteId, path])
}
