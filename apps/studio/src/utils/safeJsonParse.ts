import { hasNonEmptyString } from "~/utils/truthiness"

// safely parses json, else return string
export const safeJsonParse = (json?: string) => {
  try {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(hasNonEmptyString(json) ? json : "")
  } catch {
    return json
  }
}
