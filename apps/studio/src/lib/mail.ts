import wretch from "wretch"

import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { isEmailWhitelisted } from "~/server/modules/whitelist/whitelist.service"

interface SendMailParams {
  recipient: string
  body: string
  subject: string
}

const logger = createBaseLogger({ path: "lib/mail" })

export const sendMail = async (params: SendMailParams): Promise<void> => {
  // Safe guard to prevent sending emails to non-whitelisted emails
  const isWhitelisted = await isEmailWhitelisted(params.recipient)
  if (!isWhitelisted) {
    throw new Error("Email not whitelisted")
  }

  if (env.POSTMAN_API_KEY) {
    try {
      const response = await wretch(
        "https://api.postman.gov.sg/v1/transactional/email/send",
      )
        .auth(`Bearer ${env.POSTMAN_API_KEY}`)
        .post(params)
        .res()

      if (response.status >= 300) {
        logger.error({
          error: "Postman API error",
          status: response.status,
          recipient: params.recipient,
        })
      }
      return
    } catch (error) {
      logger.error({
        error: "Postman API call failed",
        originalError: error,
        recipient: params.recipient,
      })
      throw error
    }
  }

  console.warn(
    "POSTMAN_API_KEY is missing. Logging the following mail: ",
    params,
  )
  return
}
