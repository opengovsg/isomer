import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import {
  Box,
  Flex,
  FormControl,
  HStack,
  InputGroup,
  InputLeftAddon,
  VStack,
} from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import get from "lodash/get"
import { isHexadecimal } from "validator"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  convertHexToRgb,
  generateColorPalette,
  generateTheme,
  normalizeHex,
} from "~/features/settings/utils"

export const jsonFormsColourPickerControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ColourPickerControl,
  schemaMatches((schema) => schema.format === "color-picker"),
)

const THEME_PATHS = [
  "colors.brand.canvas.default",
  "colors.brand.canvas.alt",
  "colors.brand.canvas.backdrop",
  "colors.brand.canvas.inverse",
  "colors.brand.interaction.default",
  "colors.brand.interaction.hover",
  "colors.brand.interaction.pressed",
] as const

const DEFAULT_COLOUR_PALETTE = {
  tints: [""],
  colour: "",
  shades: [""],
}

const JsonFormsColourPickerControl = ({
  data: _data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
}: ControlProps) => {
  const data: string | undefined = typeof _data === "string" ? _data : undefined
  // NOTE: Tint is the colour brightened by 10% successively,
  // shades are the colour darkened by 10% successively
  const { tints, colour, shades } = data
    ? generateColorPalette(...convertHexToRgb(data))
    : DEFAULT_COLOUR_PALETTE

  const ctx = useJsonForms()
  const [displayedColour, setDisplayedColour] = useState(data)

  // NOTE: whenever data changes, write the corresponding correct tints and shades
  useEffect(() => {
    const otherPaths = THEME_PATHS.filter((p) => p !== path)
    const palette = generateTheme({ tints, colour, shades })
    otherPaths.forEach((p) => {
      handleChange(p, palette[p] ?? "#FFFFFF")
    })
  }, [data])

  return (
    <Box>
      <VStack gap="1.5rem">
        <FormControl isRequired={required} isInvalid={!!errors}>
          <FormLabel description={description} mb={0}>
            {label}
          </FormLabel>
          <HStack spacing="0.75rem" alignItems="center" mt="0.75rem">
            <InputGroup size="xs" w="fit-content">
              <InputLeftAddon
                borderLeftRadius="4px"
                border="1px solid"
                borderColor="base.divider.strong"
                bgColor="interaction.support.disabled"
                textColor="interaction.support.disabled-content"
              >
                #
              </InputLeftAddon>
              <Input
                value={displayedColour?.replace("#", "")}
                placeholder="FFFFFF"
                w="86px"
                onChange={(e) => {
                  const rawString = e.target.value
                  const parsedHex = rawString
                    .split("")
                    .filter((c) => isHexadecimal(c))
                    .join("")
                    .slice(0, 6) // limit to 6 characters

                  setDisplayedColour(parsedHex)

                  if (!rawString) {
                    handleChange(path, undefined)
                    return
                  }

                  handleChange(path, `#${normalizeHex(parsedHex)}`)
                }}
              />
            </InputGroup>
            <Box
              borderRadius="50%"
              border="1px solid"
              borderColor="base.divider.strong"
              bgColor={colour}
              w="2rem"
              h="2rem"
            ></Box>
          </HStack>
        </FormControl>
        <Box alignSelf="flex-start">
          <FormLabel
            description={
              "This palette makes your website accessibility compliant."
            }
            mb={0}
          >
            Color palette
          </FormLabel>
          <Flex mt="0.75rem" h="3rem">
            {THEME_PATHS.map((p) => {
              const isFirst = p === THEME_PATHS[0]
              const isLast = p === THEME_PATHS[THEME_PATHS.length - 1]

              return (
                <Box
                  h="full"
                  flex={1}
                  borderTop="2px solid"
                  borderBottom="2px solid"
                  borderRight={isLast ? "2px solid" : "none"}
                  borderLeft={isFirst ? "2px solid" : "none"}
                  borderColor="base.divider.medium"
                  borderLeftRadius={isFirst ? "6px" : "auto"}
                  borderRightRadius={isLast ? "6px" : "auto"}
                  bgColor={get(ctx.core?.data as string | undefined, p)}
                ></Box>
              )
            })}
          </Flex>
        </Box>
      </VStack>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsColourPickerControl)
