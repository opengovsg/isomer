// safely parses json, else return string
export const safeJsonParse = (json?: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(json || "")
  } catch {
    return json
  }
}
