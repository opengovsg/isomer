import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { DateFilterStatusId } from "@opengovsg/isomer-components"
import { FormControl, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches, update } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useCanManageCollectionFilters } from "~/features/editing-experience/hooks/canManageCollectionFilters"

interface StatusLabelEntry {
  id: DateFilterStatusId
  label: string
}

// Fixed 3 entries, label-only editable — add/remove is intentionally not
// exposed here (see wayfinder ticket 001: the list shape allows extending
// bucket count later without a migration, but today's UI keeps it at 3).
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

function JsonFormsDateFilterStatusLabelsArrayLayoutInner(
  props: ArrayLayoutProps,
) {
  const { data, path } = props
  const { core, dispatch } = useJsonForms()
  const items = (get(core?.data, path) as StatusLabelEntry[] | undefined) ?? []

  return (
    <VStack align="stretch" spacing="1rem" w="full">
      <FormControl>
        <FormLabel description="If you don't want to show a label, leave fields empty.">
          Custom labels
        </FormLabel>
      </FormControl>
      {[...Array(data).keys()].map((index) => {
        const item = items[index]
        if (!item) {
          return null
        }
        const meta = STATUS_ROW_META[item.id]
        const childPath = composePaths(path, `${index}`)

        return (
          <FormControl key={item.id}>
            <FormLabel description={meta.description}>{meta.name}</FormLabel>
            <Input
              value={item.label}
              onChange={(e) =>
                dispatch?.(
                  update(
                    composePaths(childPath, "label"),
                    () => e.target.value,
                  ),
                )
              }
            />
          </FormControl>
        )
      })}
    </VStack>
  )
}

const JsonFormsDateFilterStatusLabelsArrayLayout =
  withJsonFormsArrayLayoutProps(JsonFormsDateFilterStatusLabelsArrayLayoutInner)

export const jsonFormsDateFilterStatusLabelsControlTester: RankedTester =
  rankWith(
    JSON_FORMS_RANKING.DateFilterStatusLabelsControl,
    schemaMatches((schema) => schema.format === "date-filter-status-labels"),
  )

const JsonFormsDateFilterStatusLabelsControl = (props: ArrayLayoutProps) => {
  const canManageFilters = useCanManageCollectionFilters()
  if (!canManageFilters) {
    return null
  }

  return <JsonFormsDateFilterStatusLabelsArrayLayout {...props} />
}

export default JsonFormsDateFilterStatusLabelsControl
