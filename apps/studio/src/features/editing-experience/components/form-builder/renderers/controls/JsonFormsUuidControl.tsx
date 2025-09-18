import { useEffect, useMemo } from "react"
import type {
  ControlProps,
  RankedTester} from "@jsonforms/core";
import {
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsUuidControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.UuidControl,
  schemaMatches((schema) => schema.format === "uuid"),
)

export const JsonFormsUuidControl = ({
  data,
  handleChange,
  path,
}: ControlProps) => {
  const uuid = useMemo(
    () => (typeof data === "string" ? data : crypto.randomUUID()),
    [path],
  )
  useEffect(() => {
    handleChange(path, uuid)
  }, [])

  return (
    // NOTE: hide this because we want our rangers
    // to go through the dropdown ui
    null
  )
}

export default withJsonFormsControlProps(JsonFormsUuidControl)
