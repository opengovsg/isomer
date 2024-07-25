import type { UseRadioProps } from "@chakra-ui/react"
import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { PropsWithChildren } from "react"
import { useState } from "react"
import {
  Box,
  FormControl,
  HStack,
  Icon,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input } from "@opengovsg/design-system-react"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

const LINK_TYPES = {
  page: {
    icon: BiFileBlank,
    label: "Page",
  },
  external: {
    icon: BiLink,
    label: "External link",
  },
  file: {
    icon: BiFile,
    label: "File",
  },
  email: {
    icon: BiEnvelopeOpen,
    label: "Email",
  },
} as const

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

const RadioCard = ({ children, ...rest }: PropsWithChildren<UseRadioProps>) => {
  const { getInputProps, getRadioProps } = useRadio(rest)

  return (
    <Box
      as="label"
      _first={{
        "> div": {
          borderLeftRadius: "base",
        },
      }}
      _last={{
        "> div": {
          borderRightRadius: "base",
        },
      }}
    >
      <input {...getInputProps()} />
      <Box
        {...getRadioProps()}
        cursor="pointer"
        border="1px solid"
        borderColor="base.divider.strong"
        bgColor="utility.ui"
        px="1rem"
        py="0.5rem"
        mx={0}
        _checked={{
          bgColor: "interaction.muted.main.active",
          color: "interaction.main.default",
          borderColor: "interaction.main.default",
        }}
        textTransform="none"
        fontWeight={500}
        lineHeight="1.25rem"
      >
        {children}
      </Box>
    </Box>
  )
}

interface RadioContentProps {
  selectedLinkType: string
  data: string
  handleChange: (value: string) => void
}

const RadioContent = ({
  selectedLinkType,
  data,
  handleChange,
}: RadioContentProps): JSX.Element => {
  switch (selectedLinkType) {
    case "page":
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Page permalink"
        />
      )
    case "external":
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://www.isomer.gov.sg"
        />
      )
    case "file":
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="File link"
        />
      )
    case "email":
      return (
        <Input
          type="text"
          value={data.startsWith("mailto:") ? data.slice("mailto:".length) : ""}
          onChange={(e) => handleChange(`mailto:${e.target.value}`)}
          placeholder="test@example.com"
        />
      )
    default:
      return <></>
  }
}

export function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const [selectedLinkType, setSelectedLinkType] = useState("page")

  const handleLinkTypeChange = (value: string) => {
    setSelectedLinkType(value)
    handleChange(path, "")
  }

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "link-type",
    defaultValue: "page",
    onChange: handleLinkTypeChange,
  })

  const dataString = data && typeof data === "string" ? data : ""

  return (
    <Box py="0.5rem">
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>

        <HStack {...getRootProps()} spacing={0}>
          {Object.entries(LINK_TYPES).map(([key, { icon, label }]) => {
            const radio = getRadioProps({ value: key })

            return (
              <RadioCard key={key} {...radio}>
                <HStack spacing={2}>
                  <Icon as={icon} fontSize="1.25rem" />
                  <Text textStyle="subhead-2">{label}</Text>
                </HStack>
              </RadioCard>
            )
          })}
        </HStack>

        <Box my="0.5rem">
          <RadioContent
            selectedLinkType={selectedLinkType}
            data={dataString}
            handleChange={(value) => handleChange(path, value)}
          />
        </Box>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)
