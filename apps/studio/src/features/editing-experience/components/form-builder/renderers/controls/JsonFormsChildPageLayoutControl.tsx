/* oxlint-disable unicorn/no-useless-undefined -- JSON Forms handleChange requires explicit undefined */
/* oxlint-disable unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  CHILDREN_PAGES_LAYOUT_OPTIONS,
  DEFAULT_CHILDREN_PAGES_BLOCK,
} from "@opengovsg/isomer-components"
import { IconBoxes, IconRows } from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsChildrenPagesLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ChildrenPagesControl,
  schemaMatches(
    (schema) => schema.format === DEFAULT_CHILDREN_PAGES_BLOCK.type,
  ),
)

const JsonFormsChildrenPagesLayoutControl = ({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): React.ReactNode => (
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
        // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
        value={data as string}
      >
        <Radio
          value={CHILDREN_PAGES_LAYOUT_OPTIONS.Boxes}
          allowDeselect={false}
          size="sm"
        >
          Boxes
          <IconBoxes mt="10px" />
        </Radio>
        <Radio
          value={CHILDREN_PAGES_LAYOUT_OPTIONS.Rows}
          allowDeselect={false}
          size="sm"
        >
          Rows
          <IconRows mt="10px" />
        </Radio>
      </Radio.RadioGroup>
    </FormControl>
  </Box>
)

export default withJsonFormsControlProps(JsonFormsChildrenPagesLayoutControl)
