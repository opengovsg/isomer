/* oxlint-disable eslint/no-shadow, eslint/no-use-before-define, unicorn/no-array-reduce, unicorn/no-unnecessary-type-conversion, unicorn/no-useless-collection-argument -- core cleanup deferred */
import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { FormControl, Skeleton, VStack } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  MultiSelect,
} from "@opengovsg/design-system-react"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useSuspenseCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

export const jsonFormsTaggedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TaggedControl,
  schemaMatches((schema) => schema.format === "tagged"),
)

interface TaggedControlProps extends Omit<ControlProps, "data"> {
  data: ArticlePagePageProps["tagged"]
}

export const JsonFormsTaggedControl = ({
  data,
  path,
  description,
  handleChange,
}: TaggedControlProps) => (
  <Suspense fallback={<Skeleton />}>
    <SuspendableJsonFormsTaggedControl
      data={data}
      path={path}
      description={description}
      handleChange={handleChange}
    />
  </Suspense>
)

type SuspendableJsonFormsTaggedControlProps = Pick<
  TaggedControlProps,
  "data" | "handleChange" | "description" | "path"
>

const SuspendableJsonFormsTaggedControl = ({
  path,
  data,
  handleChange,
  description,
}: SuspendableJsonFormsTaggedControlProps) => {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = useSuspenseCollectionTags({ resourceId, siteId })

  // NOTE: Because we render according to the schema,
  // this will also be rendered for Article pages
  // that are not part of a collection.
  // Hence, we render iff there is at least 1 tag
  const tagCategories = tags.reduce<
    {
      label: string
      options: (typeof tags)[number]["options"]
      tagIsRequired: boolean | undefined
    }[]
  >((acc, { label, options, isRequired: tagIsRequired }) => {
    if (options.length > 0) {
      acc.push({ label, options, tagIsRequired })
    }
    return acc
  }, [])

  return (
    tagCategories.length > 0 && (
      <VStack spacing="1.25rem">
        {tagCategories.map(({ label, options, tagIsRequired }) => {
          const selectedTagIds = new Set(data ?? [])
          const currentTagCategoryOptions = options.filter(({ id }) =>
            selectedTagIds.has(id),
          )
          const tagOptionsIds = new Set(options.map(({ id }) => id))

          const isInvalid =
            !!isNullableBooleanTrue(tagIsRequired) &&
            currentTagCategoryOptions.length === 0

          return (
            <FormControl
              key={label}
              isRequired={tagIsRequired ?? false}
              isInvalid={isInvalid}
              gap="0.5rem"
            >
              <FormLabel description={description}>{label}</FormLabel>
              <MultiSelect
                size="sm"
                nothingFoundLabel="No tags found."
                values={currentTagCategoryOptions.map(({ id }) => id)}
                name={label}
                items={options.map(({ id, label }) => ({
                  label,
                  value: id,
                }))}
                // NOTE: `value` is the new set of selected options
                onChange={(value) => {
                  const others =
                    data?.filter((tagId) => !tagOptionsIds.has(tagId)) ?? []
                  handleChange(path, [...others, ...value])
                }}
              />
              {isInvalid && (
                <FormErrorMessage>
                  At least one option must be selected
                </FormErrorMessage>
              )}
            </FormControl>
          )
        })}
      </VStack>
    )
  )
}

export default withJsonFormsControlProps(JsonFormsTaggedControl)
