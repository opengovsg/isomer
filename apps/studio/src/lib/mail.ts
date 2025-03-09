import sendgrid from "@sendgrid/mail"
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

if (env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(env.SENDGRID_API_KEY)
}

export const sgClient = env.SENDGRID_API_KEY ? sendgrid : null

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

      if (response.status !== 200) {
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

  if (sgClient && env.SENDGRID_FROM_ADDRESS) {
    await sgClient.send({
      from: env.SENDGRID_FROM_ADDRESS,
      to: params.recipient,
      subject: params.subject,
      html: params.body,
    })
    return
  }

  console.warn(
    "POSTMAN_API_KEY or SENDGRID_API_KEY missing. Logging the following mail: ",
    params,
  )
  return
}
