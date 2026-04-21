import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { CATEGORY_ID_DROPDOWN_FEATURE_KEY } from "~/lib/growthbook"

import { JsonFormsTextControl } from "./JsonFormsTextControl"

export const jsonFormsCategoryIdControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryIdControl,
  and(schemaMatches((schema) => schema.format === "category-id")),
)

interface JsonFormsCategoryIdControlProps extends ControlProps {
  data: string
}

/**
 * TODO: Replace with trpc.page.getCategories (or category options from the parent collection)
 * once the data source for `categoryId` is defined.
 */
const PLACEHOLDER_CATEGORY_OPTIONS: string[] = []

function JsonFormsCategoryIdSelect({
  data,
  handleChange,
  path,
  label,
}: JsonFormsCategoryIdControlProps) {
  return (
    <SingleSelect
      value={data}
      name={label}
      items={PLACEHOLDER_CATEGORY_OPTIONS.map((category) => ({
        label: category,
        value: category,
      }))}
      isClearable={false}
      onChange={(value) => {
        handleChange(path, value)
      }}
    />
  )
}

export function JsonFormsCategoryIdControl({
  description,
  required,
  label,
  ...props
}: ControlProps) {
  const { siteId } = useQueryParse(collectionItemSchema)

  // we enable this after we migrated category to categoryId
  // currently feature flagged it for testing on staging
  const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
    CATEGORY_ID_DROPDOWN_FEATURE_KEY,
    { enabledSites: [] },
  )

  const isDropdownEnabled = enabledSites.includes(siteId.toString())

  return isDropdownEnabled ? (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <JsonFormsCategoryIdSelect {...props} label={label} />
    </FormControl>
  ) : (
    <JsonFormsTextControl
      {...props}
      description={description}
      required={required}
      label={label}
    />
  )
}

export default withJsonFormsControlProps(JsonFormsCategoryIdControl)
