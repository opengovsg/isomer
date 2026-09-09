import type { ControlProps, RankedTester } from "@jsonforms/core"
import type {
  DateFilterSchemaType,
  DateFilterStatusId,
} from "@opengovsg/isomer-components"
import { FormControl, Text, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import { DATE_FILTER_STATUS } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCanManageCollectionFilters } from "~/features/editing-experience/hooks/canManageCollectionFilters"

const STATUS_ROW_LABELS: Record<DateFilterStatusId, string> = {
  ENDED: "If date is in the past, show",
  ONGOING: "If date is now, show",
  UPCOMING: "If date is in the future, show",
}

interface DateFilterStatusLabelsControlProps extends Omit<
  ControlProps,
  "data"
> {
  data: DateFilterSchemaType["statusLabels"]
}

function JsonFormsDateFilterStatusLabelsControlInner({
  data,
  path,
  handleChange,
  label,
  description,
}: DateFilterStatusLabelsControlProps) {
  return (
    <VStack align="stretch" spacing="1rem" w="full">
      <VStack align="stretch" spacing={0}>
        <FormLabel mb={0} isRequired>
          {label}
        </FormLabel>
        {description && (
          <Text textStyle="body-2" textColor="base.content.default">
            {description}
          </Text>
        )}
      </VStack>
      {Object.values(DATE_FILTER_STATUS).map(({ id }) => {
        const value = data?.[id] ?? ""

        return (
          <FormControl key={id} gap="0.5rem">
            <FormLabel>{STATUS_ROW_LABELS[id]}</FormLabel>
            <Input
              value={value}
              onChange={(e) =>
                handleChange(composePaths(path, id), e.target.value)
              }
            />
          </FormControl>
        )
      })}
    </VStack>
  )
}

const JsonFormsDateFilterStatusLabelsControlWithProps =
  withJsonFormsControlProps(JsonFormsDateFilterStatusLabelsControlInner)

export const jsonFormsDateFilterStatusLabelsControlTester: RankedTester =
  rankWith(
    JSON_FORMS_RANKING.DateFilterStatusLabelsControl,
    schemaMatches((schema) => schema.format === "date-filter-status-labels"),
  )

const JsonFormsDateFilterStatusLabelsControl = (props: ControlProps) => {
  const canManageFilters = useCanManageCollectionFilters()
  if (!canManageFilters) {
    return null
  }

  return <JsonFormsDateFilterStatusLabelsControlWithProps {...props} />
}

export default JsonFormsDateFilterStatusLabelsControl
