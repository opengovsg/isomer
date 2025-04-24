import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"

import { IconBoxes, IconRows } from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsChildPageLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ChildpageControl,
  schemaMatches((schema) => schema.format === "childpages"),
)

export function JsonFormsChildPageLayoutControl({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): JSX.Element {
  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel description={description}>{label || "Variant"}</FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          onChange={(value) => {
            handleChange(path, value)
          }}
          value={data as string}
        >
          <Radio value="boxes" allowDeselect={false} size="sm">
            Boxes
            <IconBoxes mt="10px" />
          </Radio>
          <Radio value="rows" allowDeselect={false} size="sm">
            Rows
            <IconRows mt="10px" />
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsChildPageLayoutControl)
