import type { ControlProps, RankedTester } from "@jsonforms/core"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Radio } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsChildPageLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ChildpageControl,
  schemaMatches((schema) => schema.format === "childpages"),
)

export function JsonFormsChildPageLayoutControl({
  data,
  label,
  id,
  enabled,
  handleChange,
  errors,
  path,
  description,
  schema,
}: ControlProps): JSX.Element {
  return (
    <Radio.RadioGroup>
      <Radio></Radio>
    </Radio.RadioGroup>
  )
}

export default withJsonFormsControlProps(JsonFormsChildPageLayoutControl)
