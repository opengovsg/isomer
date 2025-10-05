import type {
  ControlProps,
  OwnPropsOfEnum,
  RankedTester,
} from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { isEnumControl, rankWith } from "@jsonforms/core"
import { withJsonFormsEnumProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  SingleSelect,
} from "@opengovsg/design-system-react"
import startCase from "lodash/startCase"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getCustomErrorMessage } from "./utils"

export const jsonFormsEnumControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.EnumControl,
  isEnumControl,
)

export const JsonFormsEnumControl = ({
  data,
  label,
  description,
  required,
  options,
  errors,
  path,
  enabled,
  handleChange,
}: ControlProps & OwnPropsOfEnum) => {
  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>

        <SingleSelect
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          value={data}
          name={label}
          items={
            options?.map((option) => {
              return {
                label: startCase(option.label.toLocaleLowerCase()),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value: option.value,
              }
            }) ?? []
          }
          isClearable={false}
          isDisabled={!enabled}
          onChange={(value) => {
            handleChange(path, value)
          }}
        />

        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsEnumProps(JsonFormsEnumControl)
