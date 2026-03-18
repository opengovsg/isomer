import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { getResourceIdFromReferenceLink } from "@opengovsg/isomer-components"
import get from "lodash/get"

import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { LINK_TYPES_MAPPING } from "../../../LinkEditor/constants"
import { BaseLinkControl } from "./BaseLinkControl"

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

const AUTOPOPULATED_FIELDS = ["title", "description", "imageUrl"] as const

// Placeholder values from DEFAULT_BLOCKS that should be treated as empty
const PLACEHOLDER_VALUES = new Set(
  DEFAULT_BLOCKS.infocards.cards.flatMap((card) => [
    card.title,
    card.imageUrl,
  ]) ?? [],
)

const isEmptyOrPlaceholder = (value: string | undefined): boolean => {
  if (!value?.trim()) return true
  return PLACEHOLDER_VALUES.has(value)
}

function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  required,
  errors,
}: ControlProps) {
  const [lastFetched, setLastFetched] = useState()
  const { siteId } = useQueryParse(pageSchema)
  const ctx = useJsonForms()
  const utils = trpc.useUtils()

  // NOTE: If this is an internal link
  // we will auto-fill the title, description and thumbnail
  // from the referenced link
  useEffect(() => {
    // NOTE: split from the check below
    // to avoid slow rendering cycles
    if (lastFetched === data) return

    const resourceId = getResourceIdFromReferenceLink(data)
    if (!resourceId) return

    // NOTE: Omit last item because that points to this link control
    const basePath = path.split(".").slice(0, -1).join(".")

    // Check if any field is empty or contains a placeholder value before fetching
    const hasEmptyOrPlaceholderField = AUTOPOPULATED_FIELDS.some((field) =>
      isEmptyOrPlaceholder(get(ctx.core?.data, `${basePath}.${field}`)),
    )

    if (!hasEmptyOrPlaceholderField) return

    // Fetch the linked page data and auto-fill empty or placeholder fields
    utils.page.getPrefill
      .fetch({ resourceId, siteId })
      .then(({ title, description, thumbnail }) => {
        if (
          isEmptyOrPlaceholder(get(ctx.core?.data, `${basePath}.title`)) &&
          title
        ) {
          handleChange(`${basePath}.title`, title)
        }

        if (
          isEmptyOrPlaceholder(
            get(ctx.core?.data, `${basePath}.description`),
          ) &&
          description
        ) {
          handleChange(`${basePath}.description`, description)
        }

        if (
          isEmptyOrPlaceholder(get(ctx.core?.data, `${basePath}.imageUrl`)) &&
          thumbnail
        ) {
          handleChange(`${basePath}.imageUrl`, thumbnail)
        }

        setLastFetched(data)
      })
      .catch((err) => {
        // Silently fail if the linked page cannot be fetched
        console.log(err)
      })
  }, [
    data,
    siteId,
    path,
    ctx.core?.data,
    handleChange,
    utils.page.readPageAndBlob,
  ])

  return (
    <BaseLinkControl
      data={data as string}
      label={label}
      required={required}
      handleChange={handleChange}
      path={path}
      linkTypes={LINK_TYPES_MAPPING}
      description="Link a page, file, external URL, or an email address"
      errors={errors}
    />
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)
