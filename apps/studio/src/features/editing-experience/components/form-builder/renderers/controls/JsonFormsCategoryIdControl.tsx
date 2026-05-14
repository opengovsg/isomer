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
import { CATEGORY_ID_DROPDOWN_FEATURE_KEY } from "~/lib/growthbook"
import { trpc } from "~/utils/trpc"

export const jsonFormsCategoryIdControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryIdControl,
  and(schemaMatches((schema) => schema.format === "category-id")),
)

interface JsonFormsCategoryIdControlProps extends ControlProps {
  data: string
}

function SuspendableJsonFormsCategoryIdSelect({
  data,
  handleChange,
  path,
  label,
  resourceId,
}: JsonFormsCategoryIdControlProps & { resourceId: number }) {
  const { siteId } = useQueryParse(collectionItemSchema)

  const [{ categoryOptions }] = trpc.page.getCategoryOptions.useSuspenseQuery({
    siteId,
    pageId: resourceId,
  })

  return (
    <SingleSelect
      value={data}
      name={label}
      items={categoryOptions.map(({ id, label: optionLabel }) => ({
        label: optionLabel,
        value: id,
      }))}
      isClearable={true} // TODO: change to false after migration where it's no longer optional
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
  const { siteId, pageId, linkId } = useQueryParse(collectionItemSchema)

  // we enable this after we migrated category to categoryId
  // currently feature flagged it for testing on staging
  const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
    CATEGORY_ID_DROPDOWN_FEATURE_KEY,
    { enabledSites: [] },
  )

  // This control only renders inside a collection item, so one of `pageId`
  // or `linkId` is always present. Bail out instead of issuing a query with
  // an invalid id, which would throw inside Suspense and crash the form.
  const resourceId = pageId ?? linkId
  if (resourceId === undefined) return null

  return enabledSites.includes(siteId.toString()) ? (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <Suspense fallback={<Skeleton />}>
        <SuspendableJsonFormsCategoryIdSelect
          {...props}
          label={label}
          resourceId={resourceId}
        />
      </Suspense>
    </FormControl>
  ) : null
}

export default withJsonFormsControlProps(JsonFormsCategoryIdControl)
