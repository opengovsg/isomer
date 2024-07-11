import type { ControlProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  FormControl,
  HStack,
  Icon,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input, Tab } from "@opengovsg/design-system-react"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

export function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const LINK_TYPES = [
    {
      icon: BiFileBlank,
      label: "Page",
    },
    {
      icon: BiLink,
      label: "External link",
    },
    {
      icon: BiFile,
      label: "File",
    },
    {
      icon: BiEnvelopeOpen,
      label: "Email",
    },
  ]
  const dataString = data && typeof data === "string" ? data : ""

  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>

        <Tabs variant="group" onChange={() => handleChange(path, "")}>
          <TabList>
            {LINK_TYPES.map(({ icon, label }) => (
              <Tab key={label}>
                <HStack spacing={2}>
                  <Icon as={icon} fontSize="1.25rem" />
                  <Text>{label}</Text>
                </HStack>
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            <TabPanel>
              <Input
                type="text"
                value={dataString}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="Page permalink"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={dataString}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="https://www.isomer.gov.sg"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={dataString}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="File link"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={
                  dataString.startsWith("mailto:")
                    ? dataString.slice("mailto:".length)
                    : ""
                }
                onChange={(e) => handleChange(path, `mailto:${e.target.value}`)}
                placeholder="test@example.com"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)
