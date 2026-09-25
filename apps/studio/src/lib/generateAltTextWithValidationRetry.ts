import pRetry, { AbortError } from "p-retry"
import { generateAltText } from "~/lib/generateAltText"
import { isAltTextAcceptedByFormSchema } from "~/lib/isAltTextAcceptedByFormSchema"

class GeneratedAltTextValidationError extends Error {
  constructor() {
    super("Generated alt text did not pass validation")
    this.name = "GeneratedAltTextValidationError"
  }
}

// Pair Foundry can return text that fails the image block's alt regex. Retry once
// before the router surfaces an error to the editor.
export const generateAltTextWithValidationRetry = async (
  imageUrl: string,
  abortSignal?: AbortSignal,
): Promise<string> =>
  pRetry(
    async () => {
      try {
        const altText = await generateAltText(imageUrl, abortSignal)
        if (!isAltTextAcceptedByFormSchema(altText)) {
          throw new GeneratedAltTextValidationError()
        }
        return altText
      } catch (error) {
        if (error instanceof GeneratedAltTextValidationError) {
          throw error
        }
        if (error instanceof Error) {
          throw new AbortError(error)
        }
        throw new AbortError(String(error))
      }
    },
    {
      retries: 1,
      minTimeout: 0,
      signal: abortSignal,
    },
  )
