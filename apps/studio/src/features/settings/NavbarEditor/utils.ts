import type { ErrorObject } from "ajv"
import { uniq } from "lodash-es"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

// Helper function to flatten and dedupe the messages from a map of ajv
// errors (grouped by instance path) into a list suitable for display
export const getUniqueErrorMessages = (
  errors: Record<string, ErrorObject[]>,
): string[] =>
  uniq(
    Object.values(errors)
      .flat()
      .map((error) => error.message)
      // oxlint-disable-next-line unicorn/no-unnecessary-type-conversion -- core cleanup deferred
      .filter((message): message is string => !!hasNonEmptyString(message)),
  )
