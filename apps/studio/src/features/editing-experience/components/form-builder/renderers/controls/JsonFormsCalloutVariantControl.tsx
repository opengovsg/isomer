import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { CalloutVariant } from "@opengovsg/isomer-components"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import { CALLOUT_VARIANT_FORMAT } from "@opengovsg/isomer-components"
import * as calloutVariantPreviews from "~/components/icons/callout/variant"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsCalloutVariantControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CalloutVariantControl,
  schemaMatches((schema) => schema.format === CALLOUT_VARIANT_FORMAT),
)

function JsonFormsCalloutVariantControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
}: ControlProps): JSX.Element {
  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel description={description}>{label}</FormLabel>
        <Radio.RadioGroup
          onChange={(value) => {
            handleChange(path, value)
          }}
          value={data as string}
          defaultValue={schema.default as CalloutVariant}
        >
          {schema.anyOf?.map((option) => {
            const value = option.const as CalloutVariant
            const Preview = calloutVariantPreviews[value]

            return (
              <Radio key={value} value={value} allowDeselect={false} size="sm">
                {`${option.title}${value === schema.default ? " (default)" : ""}`}
                <Preview
                  aria-hidden
                  w="100%"
                  h="auto"
                  mt="0.75rem"
                  display="block"
                />
              </Radio>
            )
          })}
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCalloutVariantControl)
