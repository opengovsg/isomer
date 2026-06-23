import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { ErrorBoundary } from "react-error-boundary"
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
      // Hardcoded false (not derived from `required`) because categoryId is still
      // Type.Optional in the schema pending the category migration. Using `!required`
      // would be true in the gap between "migration ran" and "schema updated",
      // letting editors clear backfilled categoryIds. Correct behaviour across all states:
      //
      //   State                                 | isClearable=false
      //   --------------------------------------|------------------------------------------
      //   Pre-migration, old item (no categoryId) | nothing to clear — harmless
      //   Pre-migration, new item (has categoryId) | can't clear — correct
      //   Migration ran, schema not yet updated  | can't clear — protects migrated data
      //   Migration ran + schema updated         | can't clear — correct
      //
      // Once migration is complete and categoryId is made required in the schema,
      // replace with isClearable={!required}.
      isClearable={false}
      onChange={(value) => {
        handleChange(path, value)
      }}
    />
  )
}

export function JsonFormsCategoryIdControl({
  description,
  required: _required,
  label,
  ...props
}: ControlProps) {
  const { query } = useRouter()
  // Safe-parse rather than throw: this control may match a `category-id` field
  // outside the collection-item route (e.g. Storybook without a router), where
  // `siteId` is absent. In that case we simply don't render the dropdown.
  const parsedQuery = collectionItemSchema.safeParse(query)

  // Feature-flagged per site until the category-to-categoryId migration is complete for all sites.
  const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
    CATEGORY_ID_DROPDOWN_FEATURE_KEY,
    { enabledSites: [] },
  )

  if (!parsedQuery.success) return null

  // One of pageId or linkId is always present in the collection-item route.
  const resourceId = parsedQuery.data.pageId ?? parsedQuery.data.linkId
  if (resourceId === undefined) return null

  return enabledSites.includes(parsedQuery.data.siteId.toString()) ? (
    <FormControl isRequired gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <ErrorBoundary fallbackRender={() => null}>
        <Suspense fallback={<Skeleton />}>
          <SuspendableJsonFormsCategoryIdSelect
            {...props}
            label={label}
            resourceId={resourceId}
          />
        </Suspense>
      </ErrorBoundary>
    </FormControl>
  ) : null
}

export default withJsonFormsControlProps(JsonFormsCategoryIdControl)
