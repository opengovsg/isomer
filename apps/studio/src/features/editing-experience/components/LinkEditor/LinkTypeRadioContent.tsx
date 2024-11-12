import type { ReactNode } from "react"
import { InputGroup, InputLeftAddon, VStack } from "@chakra-ui/react"
import { Input } from "@opengovsg/design-system-react"

import { LINK_TYPES } from "./constants"

const HTTPS_PREFIX = "https://"
type HttpsLink = `https://${string}`

const generateHttpsLink = (data: string): HttpsLink => {
  if (data.startsWith(HTTPS_PREFIX)) {
    return data as HttpsLink
  }

  return `https://${data}`
}

interface LinkTypeRadioContentProps {
  selectedLinkType: string
  data: string
  handleChange: (value: string) => void
  pageLinkElement: ReactNode
  fileLinkElement: ReactNode
}

export const LinkTypeRadioContent = ({
  selectedLinkType,
  data,
  handleChange,
  pageLinkElement,
  fileLinkElement,
}: LinkTypeRadioContentProps): JSX.Element => {
  return (
    <VStack alignItems="flex-start" w="100%" gap="0.5rem">
      {selectedLinkType === LINK_TYPES.Page && pageLinkElement}
      {selectedLinkType === LINK_TYPES.File && fileLinkElement}
      {selectedLinkType === LINK_TYPES.External && (
        <InputGroup>
          <InputLeftAddon>https://</InputLeftAddon>
          <Input
            type="text"
            value={
              data.startsWith(HTTPS_PREFIX)
                ? data.slice(HTTPS_PREFIX.length)
                : data
            }
            onChange={(e) => {
              if (!e.target.value) {
                handleChange(e.target.value)
              }
              handleChange(generateHttpsLink(e.target.value))
            }}
            placeholder="www.isomer.gov.sg"
          />
        </InputGroup>
      )}
      {selectedLinkType === LINK_TYPES.Email && (
        <InputGroup>
          <InputLeftAddon>mailto:</InputLeftAddon>
          <Input
            type="text"
            value={
              data.startsWith("mailto:") ? data.slice("mailto:".length) : ""
            }
            onChange={(e) => {
              if (!e.target.value) {
                handleChange(e.target.value)
              }
              handleChange(`mailto:${e.target.value}`)
            }}
            placeholder="test@example.com"
          />
        </InputGroup>
      )}
    </VStack>
  )
}
