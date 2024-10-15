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

import type { LinkValueHistory } from "./constants"
import { INITIAL_LINK_VALUE_HISTORY, LINK_TYPES } from "./constants"
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
  errorMessage?: string
  setErrorMessage: (errorMessage: string) => void
  clearErrorMessage: () => void
}

export const LinkHrefEditor = ({
  value,
  onChange,
  label,
  description,
  isRequired,
  isInvalid,
  errorMessage,
  setErrorMessage,
  clearErrorMessage,
}: LinkHrefEditorProps) => {
  const linkType = getLinkHrefType(value)
  const [selectedLinkType, setSelectedLinkType] = useState(linkType)
  const [linkValueHistory, setLinkValueHistory] = useState({
    ...INITIAL_LINK_VALUE_HISTORY,
    ...{
      [linkType]: value,
    },
  } as LinkValueHistory)

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "link-type",
    defaultValue: linkType,
    onChange: (newLinkType) => {
      setSelectedLinkType(newLinkType)
      onChange(linkValueHistory[newLinkType as keyof LinkValueHistory])
    },
  })

  return (
    <FormControl isRequired={isRequired} isInvalid={isInvalid}>
      <FormLabel description={description} mb="0.5rem">
        {label}
      </FormLabel>
      <HStack {...getRootProps()} spacing={0}>
        {Object.entries(LINK_TYPES).map(([key, { icon, label }]) => {
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
          data={
            value === ""
              ? linkValueHistory[selectedLinkType as keyof LinkValueHistory] ||
                ""
              : value
          }
          handleChange={(newLinkTypeContentValue) => {
            setLinkValueHistory({
              ...linkValueHistory,
              ...{
                [selectedLinkType]: newLinkTypeContentValue,
              },
            })
            onChange(newLinkTypeContentValue)
          }}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          clearErrorMessage={clearErrorMessage}
        />
      </Box>
    </FormControl>
  )
}
