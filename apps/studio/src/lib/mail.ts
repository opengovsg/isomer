import { partition } from "lodash-es"
import wretch from "wretch"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { isEmailWhitelisted } from "~/server/modules/whitelist/whitelist.service"

interface SendMailParams {
  recipient: string
  body: string
  subject: string
  cc?: string[]
}

const logger = createBaseLogger({ path: "lib/mail" })

export const sendMail = async (params: SendMailParams): Promise<void> => {
  // Safe guard to prevent sending emails to non-whitelisted emails
  const isWhitelisted = await isEmailWhitelisted(params.recipient)
  if (!isWhitelisted) {
    throw new Error("Email not whitelisted")
  }

  // Same safeguard for cc recipients, but drop the non-whitelisted ones
  // instead of failing the whole send — mirrors Postman's own behaviour of
  // ignoring blacklisted cc addresses while still delivering to the rest.
  const [whitelistedCc, droppedCc] = partition(
    await Promise.all(
      (params.cc ?? []).map(async (email) => ({
        email,
        isWhitelisted: await isEmailWhitelisted(email),
      })),
    ),
    (r) => r.isWhitelisted,
  )
  if (droppedCc.length > 0) {
    logger.warn({
      error: "Dropping non-whitelisted cc recipients",
      cc: droppedCc.map((r) => r.email),
      subject: params.subject,
    })
  }
  const cc = whitelistedCc.map((r) => r.email)
  const payload = {
    recipient: params.recipient,
    subject: params.subject,
    body: params.body,
    ...(cc.length > 0 && { cc }),
  }

  if (env.POSTMAN_API_KEY) {
    try {
      const response = await wretch(
        "https://api.postman.gov.sg/v1/transactional/email/send",
      )
        .auth(`Bearer ${env.POSTMAN_API_KEY}`)
        .post(payload)
        .res()

      if (response.status >= 300) {
        logger.error({
          error: "Postman API error",
          status: response.status,
          recipient: params.recipient,
          subject: params.subject,
        })
        throw new PostmanApiStatusError(
          `Postman API error with status ${response.status}`,
          response.status,
        )
      }

      logger.info({
        event: "email_send_succeeded",
        status: response.status,
        recipient: params.recipient,
        subject: params.subject,
      })
      return
    } catch (error) {
      if (error instanceof PostmanApiStatusError) throw error

      logger.error({
        error: "Postman API call failed",
        originalError: error,
        recipient: params.recipient,
        subject: params.subject,
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

class PostmanApiStatusError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "PostmanApiStatusError"
  }
}
