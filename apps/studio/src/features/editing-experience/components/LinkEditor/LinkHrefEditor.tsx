import type { ReactNode } from "react"
import {
  Box,
  FormControl,
  Input,
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { useLinkEditor } from "./LinkEditorContext"
import { LinkEditorRadio } from "./LinkEditorRadio"

const HTTPS_PREFIX = "https://"
type HttpsLink = `https://${string}`

const generateHttpsLink = (data: string): HttpsLink => {
  if (data.startsWith(HTTPS_PREFIX)) {
    return data as HttpsLink
  }

  return `https://${data}`
}

interface LinkHrefEditorProps {
  label: string
  description?: string
  isRequired?: boolean
  isInvalid?: boolean
  pageLinkElement: ReactNode
  fileLinkElement: ReactNode
}

export const LinkHrefEditor = ({
  label,
  description,
  isRequired,
  isInvalid,
  pageLinkElement,
  fileLinkElement,
}: LinkHrefEditorProps) => {
  const { curHref, setHref, curType } = useLinkEditor()

  return (
    <FormControl isRequired={isRequired} isInvalid={isInvalid}>
      <FormLabel description={description} mb="0.5rem">
        {label}
      </FormLabel>
      <LinkEditorRadio />
      <Box my="0.5rem">
        {curType === "page" && pageLinkElement}
        {curType === "file" && fileLinkElement}
        {curType === "external" && (
          <InputGroup>
            <InputLeftAddon>https://</InputLeftAddon>
            <Input
              type="text"
              value={
                curHref.startsWith(HTTPS_PREFIX)
                  ? curHref.slice(HTTPS_PREFIX.length)
                  : ""
              }
              onChange={(e) => {
                if (!e.target.value) {
                  setHref(e.target.value)
                }
                setHref(generateHttpsLink(e.target.value))
              }}
              placeholder="www.isomer.gov.sg"
            />
          </InputGroup>
        )}
        {curType === "email" && (
          <InputGroup>
            <InputLeftAddon>mailto:</InputLeftAddon>
            <Input
              type="text"
              value={
                curHref.startsWith("mailto:")
                  ? curHref.slice("mailto:".length)
                  : ""
              }
              onChange={(e) => {
                if (!e.target.value) {
                  setHref(e.target.value)
                }
                setHref(`mailto:${e.target.value}`)
              }}
              placeholder="test@example.com"
            />
          </InputGroup>
        )}
      </Box>
    </FormControl>
  )
}
