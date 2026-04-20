import {
  DUPLICATE_FILTER_LABEL_MESSAGE,
  DUPLICATE_OPTION_LABEL_MESSAGE,
} from "../../../utils/formBuilderJsonFormsCore"

/** Messages that read as full sentences; omit the field label (still shown on `FormLabel` above). */
const STANDALONE_CONTROL_ERROR_MESSAGES = new Set([
  DUPLICATE_OPTION_LABEL_MESSAGE,
  DUPLICATE_FILTER_LABEL_MESSAGE,
])

interface GetCustomErrorMessageParams {
  error: string | undefined
  fieldLabel?: string
}

/**
 * Maps AJV / JsonForms error strings to UI copy. When `fieldLabel` is set, prefixes the label
 * except for standalone sentences (duplicate option/filter labels).
 */
export function getCustomErrorMessage({
  error,
  fieldLabel,
}: GetCustomErrorMessageParams): string {
  if (!error) {
    return ""
  }

  let msg: string
  if (error === "is a required property") {
    msg = "cannot be empty"
  } else if (error.startsWith("must match pattern")) {
    msg = "is not in the correct format"
  } else {
    msg = error
  }

  if (!fieldLabel || STANDALONE_CONTROL_ERROR_MESSAGES.has(msg)) {
    return msg
  }
  return `${fieldLabel} ${msg}`
}
