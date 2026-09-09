import type { ControlProps, RankedTester } from "@jsonforms/core"
import type {
  DateFilterSchemaType,
  DateFilterStatusId,
} from "@opengovsg/isomer-components"
import { FormControl, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import { DATE_FILTER_STATUS } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCanManageCollectionFilters } from "~/features/editing-experience/hooks/canManageCollectionFilters"

const STATUS_ROW_META: Record<
  DateFilterStatusId,
  { name: string; description: string }
> = {
  UPCOMING: {
    name: "Upcoming",
    description: "Shown before the item's date has arrived",
  },
  ONGOING: {
    name: "Ongoing",
    description: "Shown on and between the item's date(s)",
  },
  ENDED: {
    name: "Ended",
    description: "Shown after the item's date has passed",
  },
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
}: DateFilterStatusLabelsControlProps) {
  return (
    <VStack align="stretch" spacing="1rem" w="full">
      <FormControl>
        <FormLabel description="If you don't want to show a label, leave fields empty.">
          Custom labels
        </FormLabel>
      </FormControl>
      {Object.values(DATE_FILTER_STATUS).map(({ id, defaultLabel }) => {
        const meta = STATUS_ROW_META[id]
        const value = data?.[id] ?? defaultLabel

        return (
          <FormControl key={id}>
            <FormLabel description={meta.description}>{meta.name}</FormLabel>
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
