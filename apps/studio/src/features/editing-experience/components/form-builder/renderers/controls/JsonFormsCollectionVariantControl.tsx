import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import { COLLECTION_VARIANT_OPTIONS } from "@opengovsg/isomer-components"

import { IconOneColumnLayout, IconTwoColumnLayout } from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useNewCollectionEditingExperience } from "~/hooks/useNewCollectionEditingExperience"

export const jsonFormsCollectionVariantControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CollectionVariantControl,
  schemaMatches((schema) => schema.format === "collection-variant"),
)

function JsonFormsCollectionVariantControl({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): JSX.Element {
  const isNewCollectionEditingExperienceEnabled =
    useNewCollectionEditingExperience()

  if (!isNewCollectionEditingExperienceEnabled) {
    return <></>
  }

  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel description={description}>{label || "Layout"}</FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          onChange={(value) => {
            handleChange(path, value)
          }}
          value={data as string}
        >
          <Radio
            value={COLLECTION_VARIANT_OPTIONS.Blog}
            allowDeselect={false}
            size="sm"
          >
            1-column
            <IconOneColumnLayout mt="10px" />
          </Radio>
          <Radio
            value={COLLECTION_VARIANT_OPTIONS.Collection}
            allowDeselect={false}
            size="sm"
          >
            2-column
            <IconTwoColumnLayout mt="10px" />
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCollectionVariantControl)
