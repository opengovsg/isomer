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
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  calculateRelativeLuminance,
  convertHexToRgb,
  generateTheme,
} from "~/features/settings/utils"
import { useColorPalette } from "~/hooks/useColorPalete"

export const jsonFormsColourPickerControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ColourPickerControl,
  schemaMatches((schema) => schema.format === "color-picker"),
)

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
  // NOTE: only need 7 colours in total
  // 3 tints, the original colour, and 3 shades is best
  const _luminance = calculateRelativeLuminance(colour || "#FFFFFF")

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
                placeholder="FFFFFF"
                w="86px"
                onChange={(e) =>
                  handleChange(
                    path,
                    `#${e.target.value.startsWith("#") ? e.target.value.slice(1) : e.target.value}`,
                  )
                }
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
            {generateTheme({ tints, colour, shades }).map((val, idx) => {
              const isFirst = idx === 0
              const isLast = idx === 6
              return (
                <Box
                  bgColor={val}
                  h="full"
                  flex={1}
                  borderTop="2px solid"
                  borderBottom="2px solid"
                  borderRight={isLast ? "2px solid" : "none"}
                  borderLeft={isFirst ? "2px solid" : "none"}
                  borderColor="base.divider.medium"
                  borderLeftRadius={isFirst ? "6px" : "auto"}
                  borderRightRadius={isLast ? "6px" : "auto"}
                />
              )
            })}
          </Flex>
        </Box>
        {/* TODO: Check if we need to split this up into another schema */}
        <Box alignSelf="flex-start">
          <FormLabel
            description={
              "If your site uses colours that are naturally light (e.g., orange, yellow), you may choose the light theme."
            }
            mb={0}
          >
            Theme
          </FormLabel>
        </Box>
      </VStack>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsColourPickerControl)
