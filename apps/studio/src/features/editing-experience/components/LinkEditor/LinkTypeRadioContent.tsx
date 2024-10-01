import type { ReactNode } from "react"
import { InputGroup, InputLeftAddon } from "@chakra-ui/react"
import { Input } from "@opengovsg/design-system-react"

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
  switch (selectedLinkType) {
    case "page":
      return <>{pageLinkElement}</>
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
      return <>{fileLinkElement}</>
    case "email":
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
