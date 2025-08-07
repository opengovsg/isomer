import { FormControl, VStack } from "@chakra-ui/react"
import {
  ControlProps,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, MultiSelect } from "@opengovsg/design-system-react"
import { ArticlePagePageProps } from "@opengovsg/isomer-components"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

export const jsonFormsTaggedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TaggedControl,
  schemaMatches((schema) => schema.format === "tagged"),
)

interface TaggedControlProps extends Omit<ControlProps, "data"> {
  data: ArticlePagePageProps["tagged"]
}

export function JsonFormsTaggedControl({
  data,
  path,
  description,
  required,
  handleChange,
}: TaggedControlProps) {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })

  return (
    <VStack>
      {tags?.map(({ id, label, options }) => {
        const currentTagCategory = data?.find(({ id: tagId }) => tagId === id)

        return (
          <FormControl isRequired={required} gap="0.5rem">
            <FormLabel description={description}>{label}</FormLabel>
            <MultiSelect
              values={currentTagCategory?.values ?? []}
              name={label}
              items={options.map(({ label, id }) => ({ value: id, label }))}
              onChange={(value) => {
                const remaining =
                  data?.filter(({ id: tagId }) => tagId !== id) ?? []
                const updatedItem = { id, values: value }
                const updated = [updatedItem, ...remaining]

                handleChange(path, updated)
              }}
            />
          </FormControl>
        )
      })}
    </VStack>
  )
}

export default withJsonFormsControlProps(JsonFormsTaggedControl)
