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

const MAX_TAG_CATEGORY_ITEMS = 3 as const

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
    !!tags &&
    tags.length > 1 && (
      <VStack spacing="1.25rem">
        {tags
          .filter(({ options }) => options.length > 0)
          .map(({ label, options }) => {
            const currentTagCategoryOptions = options.filter(({ id }) =>
              data?.some((selectedTagId) => selectedTagId === id),
            )
            const tagOptionsIds = options.map(({ id }) => id)

            const shouldRenderSelected =
              currentTagCategoryOptions.length >= MAX_TAG_CATEGORY_ITEMS

            return (
              <FormControl isRequired={required} gap="0.5rem">
                <FormLabel description={description}>{label}</FormLabel>
                <MultiSelect
                  values={currentTagCategoryOptions?.map(({ id }) => id) ?? []}
                  name={label}
                  items={
                    shouldRenderSelected
                      ? currentTagCategoryOptions.map(({ id, label }) => ({
                          value: id,
                          label,
                        }))
                      : options.map(({ id, label }) => {
                          return {
                            value: id,
                            label,
                          }
                        })
                  }
                  // NOTE: `value` is the new set of selected options
                  onChange={(value) => {
                    const others =
                      data?.filter((tagId) => !tagOptionsIds.includes(tagId)) ??
                      []
                    handleChange(path, [...others, ...value])
                  }}
                />
              </FormControl>
            )
          })}
      </VStack>
    )
  )
}

export default withJsonFormsControlProps(JsonFormsTaggedControl)
