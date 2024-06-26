import { Box, FormControl } from '@chakra-ui/react'
import {
  isBooleanControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core'
import { withJsonFormsControlProps } from '@jsonforms/react'
import {
  FormErrorMessage,
  FormLabel,
  Switch,
} from '@opengovsg/design-system-react'

export const jsonFormsBooleanControlTester: RankedTester = rankWith(
  2,
  isBooleanControl,
)

export function JsonFormsBooleanControl({
  data,
  label,
  id,
  enabled,
  handleChange,
  errors,
  path,
  description,
}: ControlProps) {
  return (
    <Box py={2}>
      <FormControl>
        <FormLabel description={description} htmlFor={id}>
          {label}
        </FormLabel>
        <Switch
          id={id}
          isDisabled={!enabled}
          checked={data || false}
          onChange={(e) => handleChange(path, e.target.checked)}
        />
        <FormErrorMessage>{errors}</FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsBooleanControl)
