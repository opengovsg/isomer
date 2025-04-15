import type {
  InvitationEmailTemplateData,
  PublishingNotificationEmailTemplateData,
} from "./templates"
import { createBaseLogger } from "~/lib/logger"
import { isValidEmail } from "~/utils/email"
import { sendMail } from "../../lib/mail"
import { templates } from "./templates/templates"

const logger = createBaseLogger({ path: "features/mail/service" })

const verifyEmail = (email: string) => {
  if (!isValidEmail(email)) {
    logger.error({
      error: "Invalid email format",
      email,
    })
  }
}

export async function sendInvitation(
  data: InvitationEmailTemplateData,
): Promise<void> {
  verifyEmail(data.recipientEmail)

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

export async function sendPublishingNotification(
  data: PublishingNotificationEmailTemplateData,
): Promise<void> {
  verifyEmail(data.recipientEmail)

  const template = templates.publishingNotification(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send publishing notification email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}
