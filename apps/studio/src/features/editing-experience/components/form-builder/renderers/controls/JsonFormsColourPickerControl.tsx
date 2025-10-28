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
import {
  ControlProps,
  RankedTester,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import get from "lodash/get"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  convertHexToRgb,
  generateTheme,
  normalizeHex,
} from "~/features/settings/utils"
import { useColorPalette } from "~/hooks/useColorPalete"

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

const JsonFormsColourPickerControl = ({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
}: ControlProps) => {
  // NOTE: Tint is the colour brightened by 10% successively,
  // shades are the colour darkened by 10% successively
  const { tints, colour, shades } = useColorPalette(...convertHexToRgb(data))
  const ctx = useJsonForms()
  const [displayedColour, setDisplayedColour] = useState(data)

  // NOTE: whenever data changes, write the corresponding correct tints and shades
  useEffect(() => {
    const otherPaths = THEME_PATHS.filter((p) => p !== path)
    const palette = generateTheme({ tints, colour, shades })
    otherPaths.map((p) => {
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
                value={displayedColour.replace("#", "")}
                placeholder="FFFFFF"
                w="86px"
                onChange={(e) => {
                  const rawString = e.target.value
                  const parsedHex = rawString.replace(/[^0-9A-Fa-f]/g, "")

                  setDisplayedColour(parsedHex)
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
              const isFirst = p === "colors.brand.canvas.default"
              const isLast = p === "colors.brand.interaction.pressed"

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
                  bgColor={get(ctx.core?.data, p)}
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
