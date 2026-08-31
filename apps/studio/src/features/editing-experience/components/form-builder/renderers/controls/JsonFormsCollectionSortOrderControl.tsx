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
import { useEffect, useMemo } from "react"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useSuspenseCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"

import { getCustomErrorMessage } from "./utils"

export const jsonFormsCollectionSortOrderControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CollectionSortOrderControl,
  schemaMatches((schema) => schema.format === "collection-sort-order"),
)

interface CollectionSortOrderControlProps extends Omit<ControlProps, "data"> {
  data: string | undefined
}

export function JsonFormsCollectionSortOrderControl(
  props: CollectionSortOrderControlProps,
): JSX.Element {
  return (
    <Suspense fallback={<Skeleton />}>
      <SuspendableJsonFormsCollectionSortOrderControl {...props} />
    </Suspense>
  )
}

function SuspendableJsonFormsCollectionSortOrderControl({
  data,
  label,
  description,
  required,
  errors,
  path,
  enabled,
  handleChange,
}: CollectionSortOrderControlProps): JSX.Element {
  const { siteId, pageId } = useQueryParse(pageSchema)
  const [tagCategories] = useSuspenseCollectionTags({
    resourceId: pageId,
    siteId,
  })

  const options = useMemo(
    () => getCollectionSortOptions(tagCategories),
    [tagCategories],
  )

  const resolvedValue = useMemo(
    () => resolveCollectionSortOrder(data, tagCategories),
    [data, tagCategories],
  )

  useEffect(() => {
    if (resolvedValue !== data) {
      handleChange(path, resolvedValue)
    }
  }, [data, handleChange, path, resolvedValue])

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>

        <SingleSelect
          value={resolvedValue}
          name={label}
          items={options}
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
