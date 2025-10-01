import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl } from "@chakra-ui/react"
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
  handleChange,
  errors,
  path,
  description,
  schema,
  required,
}: ControlProps): JSX.Element {
  if (schema.const !== undefined) {
    return <></>
  }

  return (
    <Box>
      <FormControl isRequired={required}>
        <Flex justifyContent="space-between" alignItems="center">
          <FormLabel
            description={description}
            htmlFor={id}
            mb={!description ? "0px" : "0.75rem"}
          >
            {label}
          </FormLabel>
          <Switch
            defaultValue={schema.default}
            defaultChecked={schema.default}
            id={id}
            isDisabled={!enabled}
            isChecked={!!data}
            onChange={(e) => handleChange(path, e.target.checked)}
          />
          <FormErrorMessage>{errors}</FormErrorMessage>
        </Flex>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsBooleanControl)
