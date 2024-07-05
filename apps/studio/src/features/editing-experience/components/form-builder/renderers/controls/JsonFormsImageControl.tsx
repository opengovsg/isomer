import {
  and,
  isBooleanControl,
  isStringControl,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  scopeEndsWith,
  uiTypeIs,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core'
import { JSON_FORMS_RANKING } from '~/constants/formBuilder'
import { Attachment, FormLabel } from '@opengovsg/design-system-react'
import { Box, FormControl } from '@chakra-ui/react'
import { withJsonFormsControlProps } from '@jsonforms/react'

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    schemaMatches((schema) => {
      console.log('Schema being tested:', schema)
      return schema.format === 'image'
    }),
    isStringControl,
  ),
)
export function JsonFormsImageControl({
  label,
  schema,
  handleChange,
  errors,
  path,
  description,
  required,
}: ControlProps) {
  return (
    <Box py={2}>
      <FormControl>
        <FormLabel description="Image Upload">{label}</FormLabel>
        <Attachment
          name="Image"
          multiple={false}
          value={undefined}
          onChange={(file) => {
            console.log(file?.name)
          }}
          onError={(error) => {
            console.log(error)
          }}
          onRejection={(rejections) => {
            console.log(rejections)
          }}
        />
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)
