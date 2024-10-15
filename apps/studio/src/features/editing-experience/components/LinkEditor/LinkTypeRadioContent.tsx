import { InputGroup, InputLeftAddon } from "@chakra-ui/react"
import { Input } from "@opengovsg/design-system-react"

import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { PageLinkElement } from "~/components/PageEditor/PageLinkElement"
import {
  LINK_TYPE_EMAIL,
  LINK_TYPE_EXTERNAL,
  LINK_TYPE_FILE,
  LINK_TYPE_PAGE,
} from "./constants"

interface LinkTypeRadioContentProps {
  selectedLinkType: string
  data: string
  handleChange: (value: string) => void
  errorMessage?: string
  setErrorMessage: (errorMessage: string) => void
  clearErrorMessage: () => void
}

export const LinkTypeRadioContent = ({
  selectedLinkType,
  data,
  handleChange,
  errorMessage,
  setErrorMessage,
  clearErrorMessage,
}: LinkTypeRadioContentProps): JSX.Element => {
  switch (selectedLinkType) {
    case LINK_TYPE_PAGE:
      return (
        <PageLinkElement
          value={data}
          onChange={(value) => handleChange(value)}
        />
      )
    case LINK_TYPE_EXTERNAL:
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://www.isomer.gov.sg"
        />
      )
    case LINK_TYPE_FILE:
      return (
        <FileAttachment
          error={errorMessage}
          setError={(value) => setErrorMessage(value)}
          clearError={() => clearErrorMessage()}
          setHref={(linkHref) => handleChange(linkHref)}
        />
      )

    case LINK_TYPE_EMAIL:
      return (
        <InputGroup>
          <InputLeftAddon>mailto:</InputLeftAddon>
          <Input
            type="text"
            value={
              data.startsWith("mailto:") ? data.slice("mailto:".length) : ""
            }
            onChange={(e) => handleChange(`mailto:${e.target.value}`)}
            placeholder="test@example.com"
          />
        </InputGroup>
      )
    default:
      return <></>
  }
}
