/* oxlint-disable unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type { ControlProps, RankedTester } from "@jsonforms/core"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { useEffect, useMemo } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsUuidControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.UuidControl,
  schemaMatches((schema) => schema.format === "uuid"),
)

const JsonFormsUuidControl = ({ data, handleChange, path }: ControlProps) => {
  const uuid = useMemo(() => {
    if (Object.prototype.toString.call(data) === "[object String]") {
      // SAFETY: JSON Forms uuid control only stores string values in data
      return data as string
    }
    return crypto.randomUUID()
  }, [data])
  useEffect(() => {
    handleChange(path, uuid)
  }, [handleChange, path, uuid])

  return (
    // NOTE: hide this because we want our rangers
    // to go through the dropdown ui
    null
  )
}

export default withJsonFormsControlProps(JsonFormsUuidControl)
