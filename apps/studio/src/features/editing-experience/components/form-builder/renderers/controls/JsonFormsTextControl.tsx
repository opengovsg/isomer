import { Box, FormControl } from '@chakra-ui/react'
import {
  isStringControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core'
import { withJsonFormsControlProps } from '@jsonforms/react'
import { FormLabel, Input } from '@opengovsg/design-system-react'

export const jsonFormsTextControlTester: RankedTester = rankWith(
  1,
  isStringControl,
)

export function JsonFormsTextControl({
  data,
  visible,
  label,
  id,
  enabled,
  uischema,
  schema,
  rootSchema,
  handleChange,
  errors,
  path,
  config,
  description,
  required,
}: ControlProps) {
  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <Input
          type="text"
          value={data || ''}
          onChange={(e) => handleChange(path, e.target.value)}
          placeholder={label}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsTextControl)
