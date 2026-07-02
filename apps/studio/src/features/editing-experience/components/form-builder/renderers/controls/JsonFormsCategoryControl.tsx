import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  SingleSelect,
} from "@opengovsg/design-system-react"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import {
  CATEGORY_SELECTION_ERROR_MESSAGE,
  isCategorySelectionValid,
} from "~/features/editing-experience/utils/validateCategorySelection"
import { useQueryParse } from "~/hooks/useQueryParse"
import {
  CATEGORY_DROPDOWN_FEATURE_KEY,
  CATEGORY_ID_DROPDOWN_FEATURE_KEY,
} from "~/lib/growthbook"
import { trpc } from "~/utils/trpc"

import { JsonFormsTextControl } from "./JsonFormsTextControl"

export const jsonFormsCategoryControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryControl,
  and(schemaMatches((schema) => schema.format === "category")),
)

interface JsonFormsCategoryControlProps extends ControlProps {
  data: string
}
function SuspendableJsonFormsCategoryControl({
  data,
  handleChange,
  path,
  label,
  description,
}: JsonFormsCategoryControlProps) {
  const { siteId, pageId, linkId } = useQueryParse(collectionItemSchema)

  const [{ categories }] = trpc.page.getCategories.useSuspenseQuery({
    siteId,
    // NOTE: This control should only be rendered inside
    // a collection - because of this,
    // there is either a `pageId` or a `linkId`
    // and if there isn't, we give a dummy value
    pageId: pageId || linkId || -1,
  })

  const isInvalid = !isCategorySelectionValid({
    hasConfigurableOptions: categories.length > 0,
    category: data,
    useCategoryId: false,
  })

  return (
    <FormControl isRequired isInvalid={isInvalid} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <SingleSelect
        value={data}
        name={label}
        items={categories.map((category) => {
          return { label: category, value: category }
        })}
        isClearable={false}
        onChange={(value) => {
          handleChange(path, value)
        }}
      />
      {isInvalid && (
        <FormErrorMessage>{CATEGORY_SELECTION_ERROR_MESSAGE}</FormErrorMessage>
      )}
    </FormControl>
  )
}

export function JsonFormsCategoryControl({
  description,
  required,
  label,
  ...props
}: ControlProps) {
  const { siteId } = useQueryParse(collectionItemSchema)
  const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
    CATEGORY_DROPDOWN_FEATURE_KEY,
    { enabledSites: [] },
  )
  const { enabledSites: categoryIdEnabledSites } = useFeatureValue<{
    enabledSites: string[]
  }>(CATEGORY_ID_DROPDOWN_FEATURE_KEY, { enabledSites: [] })

  if (categoryIdEnabledSites.includes(siteId.toString())) return null

  const isDropdownEnabled = enabledSites.includes(siteId.toString())
  return isDropdownEnabled ? (
    <Suspense fallback={<Skeleton />}>
      <SuspendableJsonFormsCategoryControl
        {...props}
        description={description}
        label={label}
      />
    </Suspense>
  ) : (
    <JsonFormsTextControl
      {...props}
      description={description}
      required={required}
      label={label}
    />
  )
}

export default withJsonFormsControlProps(JsonFormsCategoryControl)
