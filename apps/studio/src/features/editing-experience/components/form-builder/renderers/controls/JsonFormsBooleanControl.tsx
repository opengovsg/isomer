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

import { getCustomErrorMessage } from "./utils/getCustomErrorMessage"

export const jsonFormsBooleanControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.BooleanControl,
  isBooleanControl,
)

const JsonFormsBooleanControl = ({
  data,
  label,
  id,
  enabled,
  handleChange,
  errors,
  path,
  description,
  schema,
}: ControlProps): React.ReactNode | null => {
  if (schema.const !== undefined) {
    return null
  }

  return (
    <Box pt="0.5rem">
      <FormControl>
        <Flex justifyContent="space-between" alignItems="start">
          <FormLabel
            isRequired
            description={description}
            htmlFor={id}
            gap="0.25rem"
            mt="0.25rem"
            mb="0.25rem"
          >
            {label}
          </FormLabel>
          <Switch
            size="md"
            defaultChecked={!!schema.default}
            id={id}
            isDisabled={!enabled}
            isChecked={!!data}
            onChange={(e) =>{  handleChange(path, e.target.checked); }}
          />
          <FormErrorMessage>{getCustomErrorMessage(errors)}</FormErrorMessage>
        </Flex>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsBooleanControl)
