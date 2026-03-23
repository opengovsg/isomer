import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"
import get from "lodash/get"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsMaxColumnsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ChildrenPagesColControl,
  schemaMatches((schema) => schema.format === "childPagesCols"),
)

const MAX_COLUMNS_OPTIONS = [
  { label: "2 columns", value: "2" },
  { label: "3 columns", value: "3" },
]

function JsonFormsMaxColumnsControl({
  data,
  label,
  handleChange,
  path,
  description,
}: Omit<ControlProps, "data"> & {
  data?: string
}): JSX.Element | null {
  const ctx = useJsonForms()

  // Get sibling variant value
  const variant = get(
    ctx.core?.data as Record<string, string | undefined>,
    "variant",
  )

  // Only show when variant is "boxes"
  if (variant !== "boxes") {
    return null
  }

  return (
    <Box mt="-0.75rem">
      <FormControl gap="0.5rem">
        <FormLabel description={description}>
          {label || "Maximum columns"}
        </FormLabel>
        <SingleSelect
          value={data ?? "2"}
          name={label || "Maximum columns"}
          items={MAX_COLUMNS_OPTIONS}
          isClearable={false}
          onChange={(value) => handleChange(path, value)}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsMaxColumnsControl)
