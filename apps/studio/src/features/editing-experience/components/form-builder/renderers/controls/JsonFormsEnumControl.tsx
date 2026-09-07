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
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import { formatEnumLabel } from "./utils/formatEnumLabel"
import { getCustomErrorMessage } from "./utils/getCustomErrorMessage"

export const jsonFormsEnumControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.EnumControl,
  isEnumControl,
)

const JsonFormsEnumControl = ({
  data,
  label,
  description,
  required,
  options,
  errors,
  path,
  enabled,
  handleChange,
}: ControlProps & OwnPropsOfEnum) => (
  <Box>
    <FormControl isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>

      <SingleSelect
        value={data}
        name={label}
        items={
          options?.map((option) => ({
            label: formatEnumLabel(option.label),
            value: option.value,
          })) ?? []
        }
        isClearable={!isNullableBooleanTrue(required)}
        isDisabled={!enabled}
        onChange={(value) => {
          handleChange(path, value || undefined)
        }}
      />

      <FormErrorMessage>
        {label} {getCustomErrorMessage(errors)}
      </FormErrorMessage>
    </FormControl>
  </Box>
)

export default withJsonFormsEnumProps(JsonFormsEnumControl)
