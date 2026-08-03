import type { UseRadioProps } from "@chakra-ui/react"
import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, useRadio, useRadioGroup } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"
import {
  IconTagCategoryPills,
  IconTagCategoryPlaintext,
} from "~/components/icons"
import {
  goodToKnow,
  information,
  note,
  urgent,
  warning,
} from "~/components/icons/callout/variant"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { ImageRadioIndicator } from "./ImageRadioIndicator"

const isImageRadioFormat = (format: unknown): boolean =>
  format === "image-radio/1col" || format === "image-radio/2col"

const getImageRadioColumnCount = (format: string): 1 | 2 =>
  format === "image-radio/1col" ? 1 : 2

const IMAGE_RADIO_ICONS: Record<string, typeof IconTagCategoryPills> = {
  "tagcategory/pills": IconTagCategoryPills,
  "tagcategory/plaintext": IconTagCategoryPlaintext,
  "callout/information": information,
  "callout/goodToKnow": goodToKnow,
  "callout/warning": warning,
  "callout/urgent": urgent,
  "callout/note": note,
}

interface ImageRadioOptionSchema {
  const: string
  image: string
  title?: string
}

interface ImageRadioSchema {
  oneOf?: ImageRadioOptionSchema[]
  anyOf?: ImageRadioOptionSchema[]
  format?: string
}

interface ImageRadioOptionProps extends UseRadioProps {
  image: string
  isSelected: boolean
  ariaLabel: string
}

const ImageRadioOption = ({
  image,
  isSelected,
  ariaLabel,
  ...rest
}: ImageRadioOptionProps) => {
  const { getInputProps, getRadioProps } = useRadio(rest)
  const ImageRadioIcon = IMAGE_RADIO_ICONS[image]

  return (
    <Box as="label" cursor="pointer" width="100%" lineHeight={0}>
      <input {...getInputProps()} aria-label={ariaLabel} />
      <Box
        {...getRadioProps()}
        position="relative"
        width="100%"
        borderRadius="4px"
        borderWidth="1.5px"
        borderStyle="solid"
        borderColor={
          isSelected ? "interaction.main.default" : "base.divider.medium"
        }
        bg={isSelected ? "white" : undefined}
        boxShadow={
          isSelected ? "0 0 10px 0 rgba(191, 191, 191, 0.50)" : undefined
        }
        overflow="hidden"
      >
        {ImageRadioIcon && (
          <ImageRadioIcon width="100%" display="block" aria-hidden />
        )}
        <ImageRadioIndicator
          isSelected={isSelected}
          position="absolute"
          top="0.5rem"
          left="0.5rem"
          pointerEvents="none"
          aria-hidden
        />
      </Box>
    </Box>
  )
}

const getImageRadioOptions = (schema: ControlProps["schema"]) => {
  const imageRadioSchema = schema as ImageRadioSchema
  const options = imageRadioSchema.oneOf ?? imageRadioSchema.anyOf ?? []

  return options.map((option) => ({
    value: option.const,
    image: option.image,
    label: option.title ?? option.const,
  }))
}

export const jsonFormsImageRadioControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageRadioControl,
  schemaMatches((schema) => isImageRadioFormat(schema.format)),
)

function JsonFormsImageRadioControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
  required,
}: ControlProps): JSX.Element {
  const options = getImageRadioOptions(schema)
  const columnCount = getImageRadioColumnCount(schema.format as string)

  // Use Chakra's useRadioGroup instead of design-system Radio.RadioGroup.
  // Design-system Radio applies container padding and label margin (for the
  // circular control) that we cannot remove cleanly when the visual is a
  // full-bleed image card with a custom border. Same approach as LinkEditorRadioGroup.
  const { getRootProps, getRadioProps } = useRadioGroup({
    value: data as string,
    onChange: (value) => {
      handleChange(path, value)
    },
  })

  return (
    <Box>
      <FormControl isRequired={required} gap="0.5rem">
        <FormLabel description={description}>{label}</FormLabel>
        <Box
          {...getRootProps()}
          display="grid"
          gridTemplateColumns={`repeat(${columnCount}, 1fr)`}
          gap="1rem"
        >
          {options.map((option) => {
            const isSelected = data === option.value

            return (
              <ImageRadioOption
                key={option.value}
                {...getRadioProps({ value: option.value })}
                image={option.image}
                isSelected={isSelected}
                ariaLabel={option.label}
              />
            )
          })}
        </Box>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageRadioControl)
