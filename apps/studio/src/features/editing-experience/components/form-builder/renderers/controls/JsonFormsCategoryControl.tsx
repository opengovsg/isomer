import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

export const jsonFormsCategoryControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.RefControl,
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
      onChange={(value) => handleChange(path, value)}
    />
  )
}

export function JsonFormsCategoryControl({
  description,
  required,
  label,
  ...props
}: ControlProps) {
  return (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <Suspense fallback={<Skeleton />}>
        <SuspendableJsonFormsCategoryControl {...props} label={label} />
      </Suspense>
    </FormControl>
  )
}

export default withJsonFormsControlProps(JsonFormsCategoryControl)
