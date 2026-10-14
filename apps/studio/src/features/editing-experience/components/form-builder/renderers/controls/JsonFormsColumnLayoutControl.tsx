import type { UseRadioProps } from "@chakra-ui/react"
import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { ColumnLayout } from "@opengovsg/isomer-components"
import type { ColumnBlock } from "~/features/editing-experience/utils"
import {
  Box,
  FormControl,
  HStack,
  Text,
  useRadio,
  useRadioGroup,
  VStack,
} from "@chakra-ui/react"
import { composePaths, rankWith, Resolve, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"
import { COLUMN_LAYOUT_FORMAT } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { resizeColumns } from "~/features/editing-experience/utils"

export const jsonFormsColumnLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ColumnLayoutControl,
  schemaMatches((schema) => schema.format === COLUMN_LAYOUT_FORMAT),
)

// Relative widths of each column, used to draw the layout glyph.
const COLUMN_LAYOUT_RATIOS: Record<ColumnLayout, number[]> = {
  twoEqual: [1, 1],
  oneThirdTwoThirds: [1, 2],
  twoThirdsOneThird: [2, 1],
  threeEqual: [1, 1, 1],
}

interface ColumnLayoutSchema {
  anyOf?: {
    const: ColumnLayout
    title?: string
  }[]
}

interface ColumnLayoutOptionProps extends UseRadioProps {
  layout: ColumnLayout
  title: string
  isSelected: boolean
}

const ColumnLayoutOption = ({
  layout,
  title,
  isSelected,
  ...rest
}: ColumnLayoutOptionProps) => {
  const { getInputProps, getRadioProps } = useRadio(rest)

  return (
    <VStack as="label" cursor="pointer" flex={1} minW={0} spacing="0.25rem">
      <input {...getInputProps()} aria-label={title} />
      <HStack
        {...getRadioProps()}
        w="100%"
        h="2.25rem"
        p="0.5rem"
        spacing="3px"
        borderRadius="4px"
        borderWidth="1.5px"
        borderStyle="solid"
        borderColor={
          isSelected ? "interaction.main.default" : "base.divider.strong"
        }
        bg="white"
        boxShadow={
          isSelected ? "0 0 10px 0 rgba(191, 191, 191, 0.50)" : undefined
        }
      >
        {COLUMN_LAYOUT_RATIOS[layout].map((ratio, index) => (
          <Box
            key={index}
            flex={ratio}
            h="100%"
            borderRadius="2px"
            bg={
              isSelected
                ? "interaction.main.default"
                : "interaction.main-subtle.default"
            }
            aria-hidden
          />
        ))}
      </HStack>
      <Text
        textStyle={isSelected ? "caption-1" : "caption-2"}
        color={isSelected ? "interaction.main.default" : "base.content.medium"}
        textAlign="center"
        noOfLines={1}
      >
        {title}
      </Text>
    </VStack>
  )
}

/**
 * Picks the layout of a Column block. Changing the layout also resizes the
 * sibling `columns` array so there is exactly one slot per column.
 */
function JsonFormsColumnLayoutControl({
  data,
  label,
  description,
  handleChange,
  path,
  schema,
  required,
}: ControlProps): JSX.Element {
  const { core } = useJsonForms()
  const options = ((schema as ColumnLayoutSchema).anyOf ?? []).map(
    (option) => ({
      value: option.const,
      title: option.title ?? option.const,
    }),
  )

  // `path` is "<block path>.variant"; the slots live next to it.
  const columnsPath = composePaths(
    path.split(".").slice(0, -1).join("."),
    "columns",
  )

  const { getRootProps, getRadioProps } = useRadioGroup({
    value: data as string | undefined,
    onChange: (value: ColumnLayout) => {
      handleChange(path, value)
      const columns =
        (Resolve.data(core?.data, columnsPath) as
          | ColumnBlock["columns"]
          | undefined) ?? []
      handleChange(columnsPath, resizeColumns(columns, value))
    },
  })

  return (
    <Box>
      <FormControl isRequired={required} gap="0.5rem">
        <FormLabel description={description}>{label}</FormLabel>
        <HStack {...getRootProps()} spacing="0.5rem" align="start">
          {options.map((option, index) => (
            <ColumnLayoutOption
              key={option.value}
              {...getRadioProps({ value: option.value })}
              layout={option.value}
              title={option.title}
              // Mirror JsonFormsImageRadioControl: show the first option as
              // selected until a value is stored, without writing it.
              isSelected={
                data === undefined ? index === 0 : data === option.value
              }
            />
          ))}
        </HStack>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsColumnLayoutControl)
