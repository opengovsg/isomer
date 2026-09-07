import type { ErrorObject } from "ajv"
import { uniq } from "lodash-es"

// Helper function to flatten and dedupe the messages from a map of ajv
// errors (grouped by instance path) into a list suitable for display
export const getUniqueErrorMessages = (
  errors: Record<string, ErrorObject[]>,
): string[] =>
  uniq(
    Object.values(errors)
      .flat()
      .map((error) => error.message)
      .filter((message): message is string => !!message),
  )
