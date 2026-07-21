import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { CalloutVariant } from "@opengovsg/isomer-components"
import type { ComponentType } from "react"
import { Box, FormControl, type HTMLChakraProps } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import { CALLOUT_VARIANT_FORMAT } from "@opengovsg/isomer-components"
import { StyleCardGoodToKnow } from "~/components/icons/callout/variant/goodToKnow"
import { StyleCardInformation } from "~/components/icons/callout/variant/information"
import { StyleCardNote } from "~/components/icons/callout/variant/note"
import { StyleCardUrgent } from "~/components/icons/callout/variant/urgent"
import { StyleCardWarning } from "~/components/icons/callout/variant/warning"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsCalloutVariantControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CalloutVariantControl,
  schemaMatches((schema) => schema.format === CALLOUT_VARIANT_FORMAT),
)

const CALLOUT_VARIANT_PREVIEWS: Record<
  CalloutVariant,
  ComponentType<HTMLChakraProps<"svg">>
> = {
  information: StyleCardInformation,
  goodToKnow: StyleCardGoodToKnow,
  warning: StyleCardWarning,
  urgent: StyleCardUrgent,
  note: StyleCardNote,
}

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
            const Preview = CALLOUT_VARIANT_PREVIEWS[value]

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
