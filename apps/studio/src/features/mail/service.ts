import type {
  AccountDeactivationEmailTemplateData,
  AccountDeactivationWarningEmailTemplateData,
  InvitationEmailTemplateData,
  LoginAlertEmailTemplateData,
  PublishAlertContentPublisherEmailTemplateData,
  PublishAlertSiteAdminEmailTemplateData,
} from "./templates"
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

export async function sendLoginAlertEmail(
  data: LoginAlertEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.loginAlert(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send login alert email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}

export async function sendPublishAlertContentPublisherEmail(
  data: PublishAlertContentPublisherEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.publishAlertContentPublisher(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send publish alert content publisher email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}

export async function sendPublishAlertSiteAdminEmail(
  data: PublishAlertSiteAdminEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.publishAlertSiteAdmin(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send publish alert site admin email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}

export async function sendAccountDeactivationWarningEmail(
  data: AccountDeactivationWarningEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.accountDeactivationWarning(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send account deactivation warning email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}

export async function sendAccountDeactivationEmail(
  data: AccountDeactivationEmailTemplateData,
): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  const template = templates.accountDeactivation(data)

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: "Failed to send account deactivation email",
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}
