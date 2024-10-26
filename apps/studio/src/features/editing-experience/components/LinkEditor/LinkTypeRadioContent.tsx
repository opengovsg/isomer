import type { ReactNode } from "react"
import { InputGroup, InputLeftAddon } from "@chakra-ui/react"
import { Input } from "@opengovsg/design-system-react"
import {
  LINK_TYPE_EMAIL,
  LINK_TYPE_EXTERNAL,
  LINK_TYPE_FILE,
  LINK_TYPE_PAGE,
} from "@opengovsg/isomer-components"

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
    <>
      {selectedLinkType === LINK_TYPE_PAGE && pageLinkElement}
      {selectedLinkType === LINK_TYPE_FILE && fileLinkElement}
      {selectedLinkType === LINK_TYPE_EXTERNAL && (
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
      {selectedLinkType === LINK_TYPE_EMAIL && (
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
    </>
  )
}
