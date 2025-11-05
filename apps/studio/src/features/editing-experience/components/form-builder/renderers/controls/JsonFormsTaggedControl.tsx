import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { FormControl, Skeleton, VStack } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, MultiSelect } from "@opengovsg/design-system-react"

import Suspense from "~/components/Suspense"
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
  return (
    <Suspense fallback={<Skeleton />}>
      <SuspendableJsonFormsTaggedControl
        data={data}
        path={path}
        description={description}
        required={required}
        handleChange={handleChange}
      />
    </Suspense>
  )
}

type SuspendableJsonFormsTaggedControlProps = Pick<
  TaggedControlProps,
  "data" | "required" | "handleChange" | "description" | "path"
>

const SuspendableJsonFormsTaggedControl = ({
  path,
  data,
  handleChange,
  required,
  description,
}: SuspendableJsonFormsTaggedControlProps) => {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })

  // NOTE: Because we render according to the schema,
  // this will also be rendered for Article pages
  // that are not part of a collection.
  // Hence, we render iff there is at least 1 tag
  return (
    tags.length > 0 && (
      <VStack spacing="1.25rem">
        {tags
          .filter(({ options }) => options.length > 0)
          .map(({ label, options }) => {
            const currentTagCategoryOptions = options.filter(({ id }) =>
              data?.some((selectedTagId) => selectedTagId === id),
            )
            const tagOptionsIds = options.map(({ id }) => id)

            return (
              <FormControl isRequired={required} gap="0.5rem">
                <FormLabel description={description}>{label}</FormLabel>
                <MultiSelect
                  size="sm"
                  nothingFoundLabel="No tags found. Search for something else or contact your site owner(s) to create new tags."
                  values={currentTagCategoryOptions.map(({ id }) => id)}
                  name={label}
                  items={options.map(({ id, label }) => {
                    return {
                      value: id,
                      label,
                    }
                  })}
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
