import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useProseEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { TiptapProseEditor } from "../TipTapEditor/TiptapProseEditor"

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
  const editor = useProseEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange: (content) => handleChange(path, content),
  })

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <TiptapProseEditor editor={editor} />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsProseControl)
