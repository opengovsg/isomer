import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { StaticImageData } from "next/image"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  CALLOUT_VARIANT_FORMAT,
  CalloutVariant,
} from "@opengovsg/isomer-components"
import Image from "next/image"
import calloutGoodToKnowImgRaw from "~/components/icons/callout/StyleCard-good-to-know.svg"
import calloutInfoImgRaw from "~/components/icons/callout/StyleCard-info.svg"
import calloutNoteImgRaw from "~/components/icons/callout/StyleCard-note.svg"
import calloutUrgentImgRaw from "~/components/icons/callout/StyleCard-urgent.svg"
import calloutWarningImgRaw from "~/components/icons/callout/StyleCard-warning.svg"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

const calloutInfoImg = calloutInfoImgRaw as StaticImageData
const calloutGoodToKnowImg = calloutGoodToKnowImgRaw as StaticImageData
const calloutWarningImg = calloutWarningImgRaw as StaticImageData
const calloutUrgentImg = calloutUrgentImgRaw as StaticImageData
const calloutNoteImg = calloutNoteImgRaw as StaticImageData

export const jsonFormsCalloutVariantControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CalloutVariantControl,
  schemaMatches((schema) => schema.format === CALLOUT_VARIANT_FORMAT),
)

const CALLOUT_VARIANT_IMAGES: Record<
  (typeof CalloutVariant)[keyof typeof CalloutVariant]["value"],
  StaticImageData
> = {
  [CalloutVariant.Information.value]: calloutInfoImg,
  [CalloutVariant.GoodToKnow.value]: calloutGoodToKnowImg,
  [CalloutVariant.Warning.value]: calloutWarningImg,
  [CalloutVariant.Urgent.value]: calloutUrgentImg,
  [CalloutVariant.Note.value]: calloutNoteImg,
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
            ({ value, label: optionLabel }) => (
              <Radio key={value} value={value} allowDeselect={false} size="sm">
                {optionLabel}
                <Image
                  src={CALLOUT_VARIANT_IMAGES[value]}
                  alt=""
                  style={{
                    width: "100%",
                    height: "auto",
                    marginTop: "0.75rem",
                  }}
                />
              </Radio>
            ),
          )}
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCalloutVariantControl)
