import { Suspense, useMemo, useState } from "react"
import { FormControl, Skeleton, VStack } from "@chakra-ui/react"
import {
  and,
  ArrayLayoutProps,
  ControlProps,
  findUISchema,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
  withJsonFormsControlProps,
} from "@jsonforms/react"
import {
  FormLabel,
  MultiSelect,
  SingleSelect,
} from "@opengovsg/design-system-react"
import { ArticlePagePageProps } from "@opengovsg/isomer-components"
import required from "ajv/dist/vocabularies/validation/required"
import { useSetAtom } from "jotai"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { tagCategoriesAtom } from "../../atoms"

export const jsonFormsTaggedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  and(schemaMatches((schema) => schema.format === "tagged")),
)

interface TaggedControlProps extends Omit<ControlProps, "data"> {
  data: ArticlePagePageProps["tagged"]
}

export function JsonFormsTaggedControl({
  data,
  path,
  visible,
  schema,
  renderers,
  cells,
  description,
  label,
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
  const [tagCategory, updateTagCategory] = useState(data)

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
                handleChange(path, value)
              }}
            />
          </FormControl>
        )
      })}
    </VStack>
  )
}

export default withJsonFormsControlProps(JsonFormsTaggedControl)
