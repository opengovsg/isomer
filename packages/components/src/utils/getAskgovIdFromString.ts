import { ASKGOV_AGENCY_ID_REGEX, ASKGOV_URL_REGEX } from "./validation"

const AGENCY_ID = new RegExp(`^${ASKGOV_AGENCY_ID_REGEX}$`)
const ASKGOV_URL = new RegExp(`^${ASKGOV_URL_REGEX}$`)

/**
 * Normalises an AskGov agency ID or an ask.gov.sg link down to the bare agency
 * ID that the widget script expects, or `null` if the value is neither.
 */
export const getAskgovIdFromString = (value: string): string | null => {
  const trimmed = value.trim()

  if (AGENCY_ID.test(trimmed)) return trimmed

  return ASKGOV_URL.exec(trimmed)?.[1] ?? null
}
