import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { SupportedIconName } from "@opengovsg/isomer-components"
import { Box, chakra, FormControl, Grid, Icon } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import {
  ICON_PICKER_FORMAT,
  SUPPORTED_ICON_LABELS,
  SUPPORTED_ICONS_MAP,
} from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { getCustomErrorMessage } from "./utils"

const ICON_PICKER_ROWS = 2
// Buttons are capped so they stay compact in wide containers, but shrink to
// keep both rows inside the editor sidebar on narrow viewports
const ICON_PICKER_BUTTON_MAX_SIZE = "2.5rem"

export const jsonFormsIconPickerControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.IconPickerControl,
  schemaMatches((schema) => schema.format === ICON_PICKER_FORMAT),
)

interface IconPickerOption {
  value: SupportedIconName
  label: string
}

const isSupportedIconName = (value: unknown): value is SupportedIconName =>
  typeof value === "string" && value in SUPPORTED_ICONS_MAP

// The icon field is a union of string literals, which TypeBox emits as
// `anyOf: [{ const }]`. Fall back to `oneOf`/`enum` so the picker keeps
// working if the schema shape changes.
export const getIconPickerOptions = (
  schema: JsonSchema,
): IconPickerOption[] => {
  const literalSchemas = schema.anyOf ?? schema.oneOf
  const candidates: unknown[] = literalSchemas
    ? literalSchemas.map((literal) => literal.const as unknown)
    : (schema.enum ?? [])

  return candidates.flatMap((value) =>
    isSupportedIconName(value)
      ? [{ value, label: SUPPORTED_ICON_LABELS[value] }]
      : [],
  )
}

interface IconPickerButtonProps {
  option: IconPickerOption
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}

const IconPickerButton = ({
  option,
  isSelected,
  isDisabled,
  onClick,
}: IconPickerButtonProps) => {
  const IconComponent = SUPPORTED_ICONS_MAP[option.value]

  return (
    <chakra.button
      type="button"
      aria-label={option.label}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={onClick}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minW={0}
      w="100%"
      sx={{ aspectRatio: "1 / 1" }}
      borderRadius="4px"
      borderWidth="1.5px"
      borderStyle="solid"
      borderColor={
        isSelected ? "interaction.main.default" : "base.divider.medium"
      }
      bg={isSelected ? "interaction.muted.main.active" : "white"}
      color={isSelected ? "base.content.brand" : "base.content.default"}
      cursor="pointer"
      transitionProperty="common"
      transitionDuration="normal"
      _hover={{
        borderColor: isSelected
          ? "interaction.main.hover"
          : "interaction.main-subtle.hover",
        bg: isSelected
          ? "interaction.main-subtle.hover"
          : "interaction.muted.main.hover",
      }}
      _focusVisible={{
        outline: "none",
        boxShadow: "0 0 0 2px var(--chakra-colors-utility-focus-default)",
      }}
      _disabled={{
        cursor: "not-allowed",
        opacity: 0.5,
        _hover: {
          borderColor: isSelected
            ? "interaction.main.default"
            : "base.divider.medium",
          bg: isSelected ? "interaction.muted.main.active" : "white",
        },
      }}
    >
      <Icon as={IconComponent} boxSize="1.25rem" aria-hidden />
    </chakra.button>
  )
}

function JsonFormsIconPickerControl({
  data,
  label,
  description,
  required,
  errors,
  path,
  schema,
  enabled,
  handleChange,
}: ControlProps): JSX.Element {
  const options = getIconPickerOptions(schema)
  const columns = Math.max(1, Math.ceil(options.length / ICON_PICKER_ROWS))

  return (
    <Box>
      <FormControl isRequired={required} isInvalid={!!errors} gap="0.5rem">
        <FormLabel description={description}>{label}</FormLabel>
        <Grid
          role="group"
          aria-label={label}
          templateColumns={`repeat(${columns}, minmax(0, ${ICON_PICKER_BUTTON_MAX_SIZE}))`}
          gap="0.5rem"
        >
          {options.map((option) => {
            const isSelected = data === option.value

            return (
              <IconPickerButton
                key={option.value}
                option={option}
                isSelected={isSelected}
                isDisabled={!enabled}
                onClick={() => {
                  // Clicking the selected icon again clears an optional field
                  if (isSelected && !required) {
                    handleChange(path, undefined)
                    return
                  }
                  handleChange(path, option.value)
                }}
              />
            )
          })}
        </Grid>
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsIconPickerControl)
