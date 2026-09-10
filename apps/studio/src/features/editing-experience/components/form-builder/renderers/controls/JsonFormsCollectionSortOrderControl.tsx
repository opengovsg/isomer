import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, Skeleton } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Infobox,
  SingleSelect,
} from "@opengovsg/design-system-react"
import {
  DEFAULT_COLLECTION_SORT_ORDER,
  resolveCollectionSortOrder,
} from "@opengovsg/isomer-components"
import { useEffect } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { pageSchema } from "~/features/editing-experience/schema"
import { getCollectionSortOptions } from "~/features/editing-experience/utils"
import { useQueryParse } from "~/hooks/useQueryParse"

import { getCustomErrorMessage } from "./utils"

export const jsonFormsCollectionSortOrderControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CollectionSortOrderControl,
  schemaMatches((schema) => schema.format === "collection-sort-order"),
)

export function JsonFormsCollectionSortOrderControlBase({
  data,
  label,
  description,
  required,
  errors,
  path,
  enabled,
  handleChange,
}: ControlProps): JSX.Element {
  const { siteId, pageId } = useQueryParse(pageSchema)
  const {
    data: tagCategories = [],
    isLoading,
    isSuccess,
    isError,
  } = useCollectionTags({
    resourceId: pageId,
    siteId,
  })
  const sortOrder = typeof data === "string" ? data : undefined
  const resolvedValue = isSuccess
    ? resolveCollectionSortOrder(sortOrder, tagCategories)
    : (sortOrder ?? DEFAULT_COLLECTION_SORT_ORDER)

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    if (resolvedValue !== data) {
      handleChange(path, resolvedValue)
    }
  }, [data, handleChange, isSuccess, path, resolvedValue])

  if (isLoading) {
    return <Skeleton />
  }

  if (isError) {
    return (
      <Infobox variant="warning" size="sm">
        We couldn&apos;t load collection filters, so sort options are
        unavailable. Refresh the page to try again.
      </Infobox>
    )
  }

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>

        <SingleSelect
          value={resolvedValue}
          name={label}
          items={getCollectionSortOptions(tagCategories)}
          isClearable={false}
          isDisabled={!enabled}
          onChange={(value) => {
            handleChange(path, value)
          }}
        />

        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(
  JsonFormsCollectionSortOrderControlBase,
)
