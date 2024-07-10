import type { ControlProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  FormControl,
  TabList,
  Tabs,
  TabPanel,
  TabPanels,
  Icon,
  HStack,
  Text,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Input, Tab } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "uri"),
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
                value={data || ""}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="Page permalink"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={data || ""}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="https://www.isomer.gov.sg"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={data || ""}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder="File link"
              />
            </TabPanel>
            <TabPanel>
              <Input
                type="text"
                value={
                  data && data.startsWith("mailto:")
                    ? data.slice("mailto:".length)
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
