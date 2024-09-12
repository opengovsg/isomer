import type {
  ControlProps,
  OwnPropsOfEnum,
  RankedTester,
} from "@jsonforms/core"
import { Box, FormControl, RadioGroup } from "@chakra-ui/react"
import { and, isEnumControl, rankWith } from "@jsonforms/core"
import { withJsonFormsEnumProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsRadioControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.RadioControl,
  and(isEnumControl, (_, schema) => schema.format === "radio"),
)

export function JsonFormsRadioControl({
  label,
  handleChange,
  path,
  description,
  required,
  options,
}: ControlProps & OwnPropsOfEnum) {
  if (!options) {
    return null
  }

  return (
    <Box>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <RadioGroup onChange={(value) => handleChange(path, value)}>
          {options.map((option) => (
            <Radio
              my={1}
              key={option.label}
              value={option.value}
              allowDeselect={false}
            >
              {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
            </Radio>
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsEnumProps(JsonFormsRadioControl)
