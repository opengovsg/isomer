import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { CATEGORY_DROPDOWN_FEATURE_KEY } from "~/lib/growthbook"
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

  return (
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

  const isDropdownEnabled = enabledSites.includes(siteId.toString())
  return isDropdownEnabled ? (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <Suspense fallback={<Skeleton />}>
        <SuspendableJsonFormsCategoryControl {...props} label={label} />
      </Suspense>
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

export default withJsonFormsControlProps(JsonFormsCategoryControl)
