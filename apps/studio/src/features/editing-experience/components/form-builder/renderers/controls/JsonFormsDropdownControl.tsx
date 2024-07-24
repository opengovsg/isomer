import type {
  ControlProps,
  OwnPropsOfEnum,
  RankedTester,
} from "@jsonforms/core"
import { useEffect } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import { isEnumControl, rankWith } from "@jsonforms/core"
import { withJsonFormsEnumProps } from "@jsonforms/react"
import { FormLabel, SingleSelect } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsDropdownControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.DropdownControl,
  isEnumControl,
)

export function JsonFormsDropdownControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  options,
  schema,
}: ControlProps & OwnPropsOfEnum) {
  // Use the default value if it exists
  useEffect(() => {
    if (data !== undefined || data !== "") {
      return
    }
    const value = schema.default || schema.const
    handleChange(path, value)
  }, [path, schema.default, schema.const, handleChange, data])

  if (!options || (options.length === 1 && !!schema.const)) {
    return null
  }

  const items = options.map((option) => ({
    label: option.label.charAt(0).toUpperCase() + option.label.slice(1),
    value: option.value,
  }))

  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <SingleSelect
          value={data}
          name={label}
          items={items}
          isClearable={false}
          onChange={(value) => {
            handleChange(path, value)
          }}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsEnumProps(JsonFormsDropdownControl)
