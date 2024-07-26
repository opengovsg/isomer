import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Flex, FormControl } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { TiptapEditor } from "../TipTapEditor"

export const jsonFormsProseControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ProseControl,
  (_, schema) => {
    return schema.format === "prose"
  },
)

export function JsonFormsProseControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  return (
    <Flex py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <TiptapEditor
          data={data}
          handleChange={(content) => handleChange(path, content)}
        />
      </FormControl>
    </Flex>
  )
}

export default withJsonFormsControlProps(JsonFormsProseControl)
