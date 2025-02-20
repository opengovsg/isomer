import type { InvitationEmailTemplateData } from "./templates"
import { createBaseLogger } from "~/lib/logger"
import { isValidEmail } from "~/utils/email"
import { sendMail } from "../../lib/mail"
import { templates } from "./templates/templates"

const logger = createBaseLogger({ path: "features/mail/service" })

export async function sendInvitation(
  data: InvitationEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.invitation(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send invitation email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}
