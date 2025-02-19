import type { InvitationEmailTemplateData } from "./templates"
import { createBaseLogger } from "~/lib/logger"
import { isValidEmail } from "~/utils/email"
import { sendMail } from "../../lib/mail"
import { templates } from "./templates/templates"

const logger = createBaseLogger({ path: "lib/mail/service" })

export async function sendInvitation(
  email: string,
  data: InvitationEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(email)) {
    logger.error({
      error: "Invalid email format",
      email,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.invitation({
    ...data,
    recipientEmail: email,
  })

  try {
    await sendMail({
      recipient: email,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send invitation email",
      email,
      originalError: error,
    })
    throw error
  }
}
