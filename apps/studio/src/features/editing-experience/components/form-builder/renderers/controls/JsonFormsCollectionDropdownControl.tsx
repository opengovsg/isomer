import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import { COLLECTION_DROPDOWN_FORMAT } from "@opengovsg/isomer-components"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { getReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"

export const jsonFormsCollectionDropdownControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.AnyOfControl,
  and(schemaMatches((schema) => schema.format === COLLECTION_DROPDOWN_FORMAT)),
)

interface JsonFormsCollectionDropdownControlProps extends ControlProps {
  data: string
}

function SuspendableJsonFormsCollectionDropdownControl({
  data,
  handleChange,
  path,
  label,
}: JsonFormsCollectionDropdownControlProps) {
  const { siteId } = useQueryParse(siteSchema)

  const [collections] = trpc.collection.getCollections.useSuspenseQuery({
    siteId: Number(siteId),
  })

  return (
    <SingleSelect
      value={data}
      name={label}
      items={collections.map((collection) => {
        return {
          label: collection.title,
          value: getReferenceLink({
            siteId: siteId.toString(),
            resourceId: collection.id.toString(),
          }),
        }
      })}
      isClearable={false}
      onChange={(value) => handleChange(path, value)}
    />
  )
}

export function JsonFormsCollectionDropdownControl({
  description,
  required,
  label,
  ...props
}: ControlProps) {
  return (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <Suspense fallback={<Skeleton />}>
        <SuspendableJsonFormsCollectionDropdownControl
          {...props}
          label={label}
        />
      </Suspense>
    </FormControl>
  )
}

export default withJsonFormsControlProps(JsonFormsCollectionDropdownControl)
