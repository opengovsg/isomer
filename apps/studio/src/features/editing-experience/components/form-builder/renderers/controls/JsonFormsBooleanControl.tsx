import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { isBooleanControl, rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Switch,
} from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsBooleanControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.BooleanControl,
  isBooleanControl,
)

export function JsonFormsBooleanControl({
  data,
  label,
  id,
  enabled,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  handleChange,
  errors,
  path,
  description,
  schema,
}: ControlProps): JSX.Element {
  if (schema.const !== undefined) {
    return <></>
  }

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired>
        <FormLabel description={description} htmlFor={id}>
          {label}
        </FormLabel>
        <Switch
          id={id}
          isDisabled={!enabled}
          isChecked={!!data}
          onChange={(e) => handleChange(path, e.target.checked)}
        />
        <FormErrorMessage>{errors}</FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsBooleanControl)
