import type { ControlProps, RankedTester } from "@jsonforms/core"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { and, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import { COLLECTION_DROPDOWN_FORMAT } from "@opengovsg/isomer-components"
import { useSetAtom } from "jotai"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { linkAtom } from "~/features/editing-experience/atoms"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

export const jsonFormsCollectionDropdownControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.RefControl,
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
          value: `[resource:${siteId}:${collection.id}]`,
        }
      })}
      isClearable={false}
      onChange={(value) => {
        handleChange(path, value)
      }}
    />
  )
}

export function JsonFormsCollectionDropdownControl({
  description,
  required,
  label,
  ...props
}: ControlProps) {
  const setLink = useSetAtom(linkAtom)

  const handleChange: ControlProps["handleChange"] = (path, value: string) => {
    props.handleChange(path, value)
    setLink((prev) => ({ ...prev, category: value }))
  }

  return (
    <FormControl isRequired={required} gap="0.5rem">
      <FormLabel description={description}>{label}</FormLabel>
      <Suspense fallback={<Skeleton />}>
        <SuspendableJsonFormsCollectionDropdownControl
          {...props}
          label={label}
          handleChange={handleChange}
        />
      </Suspense>
    </FormControl>
  )
}

export default withJsonFormsControlProps(JsonFormsCollectionDropdownControl)
