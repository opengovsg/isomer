import { Box, FormControl } from '@chakra-ui/react'
import {
  isEnumControl,
  rankWith,
  type ControlProps,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core'
import { withJsonFormsEnumProps } from '@jsonforms/react'
import { FormLabel, SingleSelect } from '@opengovsg/design-system-react'
import { useState } from 'react'

export const jsonFormsDropdownControlTester: RankedTester = rankWith(
  2,
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
  const [dropdownValue, setDropdownValue] = useState(data || '')

  if (!options || (options.length === 1 && !!schema.default)) {
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
          value={dropdownValue}
          name={label}
          items={items}
          isClearable={false}
          onChange={(value) => {
            setDropdownValue(value)
            handleChange(path, value)
          }}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsEnumProps(JsonFormsDropdownControl)
