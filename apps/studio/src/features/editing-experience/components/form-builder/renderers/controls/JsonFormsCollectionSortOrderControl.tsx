import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, Skeleton } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  SingleSelect,
} from "@opengovsg/design-system-react"
import {
  getCollectionSortOptions,
  resolveCollectionSortOrder,
} from "@opengovsg/isomer-components"
import { useEffect } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"

import { getCustomErrorMessage } from "./utils"

const SORT_MENU_ITEM_HEIGHT = 40
const SORT_MENU_MAX_VISIBLE_SLOTS = 4
const SORT_MENU_SCROLL_VISIBLE_ITEMS = 2.5

export const jsonFormsCollectionSortOrderControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CollectionSortOrderControl,
  schemaMatches((schema) => schema.format === "collection-sort-order"),
)

function JsonFormsCollectionSortOrderControl({
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
  const { data: tagCategories = [], isLoading } = useCollectionTags({
    resourceId: pageId,
    siteId,
  })
  const resolvedValue = resolveCollectionSortOrder(
    typeof data === "string" ? data : undefined,
    tagCategories,
  )

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (resolvedValue !== data) {
      handleChange(path, resolvedValue)
    }
  }, [data, handleChange, isLoading, path, resolvedValue])

  if (isLoading) {
    return <Skeleton />
  }

  const sortOptions = getCollectionSortOptions(tagCategories)
  const fixedItemHeight =
    sortOptions.length > SORT_MENU_MAX_VISIBLE_SLOTS
      ? (SORT_MENU_SCROLL_VISIBLE_ITEMS * SORT_MENU_ITEM_HEIGHT) /
        SORT_MENU_MAX_VISIBLE_SLOTS
      : undefined

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>

        <SingleSelect
          value={resolvedValue}
          name={label}
          items={sortOptions}
          fixedItemHeight={fixedItemHeight}
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

export default withJsonFormsControlProps(JsonFormsCollectionSortOrderControl)
