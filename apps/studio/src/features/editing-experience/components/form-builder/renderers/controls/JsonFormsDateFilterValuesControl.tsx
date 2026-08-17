import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { DateRangeValue } from "@opengovsg/design-system-react"
import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { FormControl, Skeleton, VStack } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  DateRangePicker,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import {
  resolveTagCategoryType,
  TAG_CATEGORY_TYPE,
} from "@opengovsg/isomer-components"
import { format, parseISO } from "date-fns"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useSuspenseCollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { collectionItemSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"

export const jsonFormsDateFilterValuesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.DateFilterValuesControl,
  schemaMatches((schema) => schema.format === "date-tagged"),
)

interface DateFilterValuesControlProps extends Omit<ControlProps, "data"> {
  data: ArticlePagePageProps["dateTagged"]
}

export function JsonFormsDateFilterValuesControl({
  data,
  path,
  description,
  handleChange,
}: DateFilterValuesControlProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <SuspendableJsonFormsDateFilterValuesControl
        data={data}
        path={path}
        description={description}
        handleChange={handleChange}
      />
    </Suspense>
  )
}

type SuspendableJsonFormsDateFilterValuesControlProps = Pick<
  DateFilterValuesControlProps,
  "data" | "handleChange" | "description" | "path"
>

// No separate single/range toggle: DateRangePicker's own value shape
// ([Date,Date] | [Date,null] | [null,null]) already models "only a start
// picked so far" — picking a second date is what promotes an entry to a
// range. See wayfinder ticket 007.
const SuspendableJsonFormsDateFilterValuesControl = ({
  path,
  data,
  handleChange,
  description,
}: SuspendableJsonFormsDateFilterValuesControlProps) => {
  const { siteId, linkId, pageId } = useQueryParse(collectionItemSchema)
  // NOTE: Since this is only rendered inside a collection page or collection link,
  // we should always have the `resourceId` specifier
  const resourceId = linkId ?? pageId ?? 1
  const [tags] = useSuspenseCollectionTags({ resourceId, siteId })

  const dateFilters = tags.filter(
    (tag) => resolveTagCategoryType(tag.type) === TAG_CATEGORY_TYPE.Date,
  )

  // NOTE: Because we render according to the schema, this will also be
  // rendered for Article pages that are not part of a collection. Hence, we
  // render iff there is at least 1 date filter.
  return (
    dateFilters.length > 0 && (
      <VStack spacing="1.25rem">
        {dateFilters.map(({ id, label, isRequired: dateIsRequired }) => {
          const existing = data?.find((value) => value.id === id)
          const value: DateRangeValue = existing
            ? [
                parseISO(existing.date),
                existing.endDate ? parseISO(existing.endDate) : null,
              ]
            : [null, null]

          const isInvalid = !!dateIsRequired && !existing?.date

          const handleDateChange = ([start, end]: DateRangeValue) => {
            const others = data?.filter((value) => value.id !== id) ?? []

            if (!start) {
              handleChange(path, others)
              return
            }

            handleChange(path, [
              ...others,
              {
                id,
                date: format(start, "yyyy-MM-dd"),
                ...(end ? { endDate: format(end, "yyyy-MM-dd") } : {}),
              },
            ])
          }

          return (
            <FormControl
              key={id}
              isRequired={dateIsRequired ?? false}
              isInvalid={isInvalid}
              gap="0.5rem"
            >
              <FormLabel description={description}>{label}</FormLabel>
              <DateRangePicker
                value={value}
                onChange={handleDateChange}
                monthsToDisplay={1}
              />
              {isInvalid && (
                <FormErrorMessage>A date must be selected</FormErrorMessage>
              )}
            </FormControl>
          )
        })}
      </VStack>
    )
  )
}

export default withJsonFormsControlProps(JsonFormsDateFilterValuesControl)
