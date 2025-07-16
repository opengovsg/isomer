import type {
  AccountDeactivationEmailTemplateData,
  AccountDeactivationWarningEmailTemplateData,
  BaseEmailTemplateData,
  EmailTemplate,
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

interface SendEmailWithTemplateProps {
  data: BaseEmailTemplateData
  template: EmailTemplate
  emailType: string
}
async function sendEmailWithTemplate({
  data,
  template,
  emailType,
}: SendEmailWithTemplateProps): Promise<void> {
  if (!isValidEmail(data.recipientEmail)) {
    logger.error({
      error: "Invalid email format",
      email: data.recipientEmail,
    })
    throw new Error("Invalid email format")
  }

  try {
    await sendMail({
      recipient: data.recipientEmail,
      subject: template.subject,
      body: template.body,
    })
  } catch (error) {
    logger.error({
      error: `Failed to send ${emailType} email`,
      email: data.recipientEmail,
      originalError: error,
    })
    throw error
  }
}

export async function sendInvitation(
  data: InvitationEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.invitation(data),
    emailType: "invitation",
  })
}

export async function sendLoginAlertEmail(
  data: LoginAlertEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.loginAlert(data),
    emailType: "login alert",
  })
}

export async function sendPublishAlertContentPublisherEmail(
  data: PublishAlertContentPublisherEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.publishAlertContentPublisher(data),
    emailType: "publish alert content publisher",
  })
}

export async function sendPublishAlertSiteAdminEmail(
  data: PublishAlertSiteAdminEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.publishAlertSiteAdmin(data),
    emailType: "publish alert site admin",
  })
}

export async function sendAccountDeactivationWarningEmail(
  data: AccountDeactivationWarningEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.accountDeactivationWarning(data),
    emailType: "account deactivation warning",
  })
}

export async function sendAccountDeactivationEmail(
  data: AccountDeactivationEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    template: templates.accountDeactivation(data),
    emailType: "account deactivation",
  })
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
