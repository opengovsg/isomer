import type { ReactNode } from "react"
import { useState } from "react"
import {
  Box,
  FormControl,
  HStack,
  Icon,
  Text,
  useRadioGroup,
} from "@chakra-ui/react"
import { FormLabel } from "@opengovsg/design-system-react"

import type { LinkTypeMapping } from "./constants"
import { LinkTypeRadioCard } from "./LinkTypeRadioCard"
import { LinkTypeRadioContent } from "./LinkTypeRadioContent"
import { getLinkHrefType } from "./utils"

interface LinkHrefEditorProps {
  value: string
  onChange: (href: string) => void
  label: string
  description?: string
  isRequired?: boolean
  isInvalid?: boolean
  pageLinkElement: ReactNode
  fileLinkElement: ReactNode
  linkTypes: LinkTypeMapping
}

export const LinkHrefEditor = ({
  value,
  onChange,
  label,
  description,
  isRequired,
  isInvalid,
  pageLinkElement,
  fileLinkElement,
  linkTypes,
}: LinkHrefEditorProps) => {
  const linkType = getLinkHrefType(value)
  const [selectedLinkType, setSelectedLinkType] = useState(linkType)

  const handleLinkTypeChange = (value: string) => {
    setSelectedLinkType(value)
    onChange("")
  }

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "link-type",
    defaultValue: linkType,
    onChange: handleLinkTypeChange,
  })

  return (
    <FormControl isRequired={isRequired} isInvalid={isInvalid}>
      <FormLabel description={description} mb="0.5rem">
        {label}
      </FormLabel>
      <HStack {...getRootProps()} spacing={0}>
        {Object.entries(linkTypes).map(([key, { icon, label }]) => {
          const radio = getRadioProps({ value: key })

          return (
            <LinkTypeRadioCard key={key} {...radio}>
              <HStack spacing={2}>
                <Icon as={icon} fontSize="1.25rem" />
                <Text textStyle="subhead-2">{label}</Text>
              </HStack>
            </LinkTypeRadioCard>
          )
        })}
      </HStack>
      <Box my="0.5rem">
        <LinkTypeRadioContent
          selectedLinkType={selectedLinkType}
          data={value}
          handleChange={onChange}
          pageLinkElement={pageLinkElement}
          fileLinkElement={fileLinkElement}
        />
      </Box>
    </FormControl>
  )
}
