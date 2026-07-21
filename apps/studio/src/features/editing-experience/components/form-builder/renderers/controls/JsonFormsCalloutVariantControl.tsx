import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ComponentType } from "react"
import { Box, FormControl, type HTMLChakraProps } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  CALLOUT_VARIANT_FORMAT,
  CalloutVariant,
} from "@opengovsg/isomer-components"
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
  (typeof CalloutVariant)[keyof typeof CalloutVariant]["value"],
  ComponentType<HTMLChakraProps<"svg">>
> = {
  [CalloutVariant.Information.value]: StyleCardInformation,
  [CalloutVariant.GoodToKnow.value]: StyleCardGoodToKnow,
  [CalloutVariant.Warning.value]: StyleCardWarning,
  [CalloutVariant.Urgent.value]: StyleCardUrgent,
  [CalloutVariant.Note.value]: StyleCardNote,
}

function JsonFormsCalloutVariantControl({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): JSX.Element {
  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel description={description}>
          {label || "Message type"}
        </FormLabel>
        <Radio.RadioGroup
          onChange={(value) => {
            handleChange(path, value)
          }}
          value={data as string}
          defaultValue={CalloutVariant.Information.value}
        >
          {Object.values(CalloutVariant).map(
            ({ value, label: optionLabel }) => {
              const Preview = CALLOUT_VARIANT_PREVIEWS[value]
              return (
                <Radio
                  key={value}
                  value={value}
                  allowDeselect={false}
                  size="sm"
                >
                  {optionLabel}
                  <Preview
                    aria-hidden
                    w="100%"
                    h="auto"
                    mt="0.75rem"
                    display="block"
                  />
                </Radio>
              )
            },
          )}
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCalloutVariantControl)
