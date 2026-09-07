import { createBaseLogger } from "~/lib/logger"
import { isValidEmail } from "~/utils/email"

import type {
  AccountDeactivationEmailTemplateData,
  AccountDeactivationWarningEmailTemplateData,
  AuditLogExportFailedEmailTemplateData,
  AuditLogExportReadyEmailTemplateData,
  BaseEmailTemplateData,
  CancelSchedulePageTemplateData,
  EmailTemplate,
  FailedPublishTemplateData,
  GazetteDeletionEmailTemplateData,
  InvitationEmailTemplateData,
  LoginAlertEmailTemplateData,
  PublishAlertContentPublisherEmailTemplateData,
  PublishAlertSiteAdminEmailTemplateData,
  SchedulePageTemplateData,
  SuccessfulPublishTemplateData,
} from "./templates/types"
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
      email: data.recipientEmail,
      error: "Invalid email format",
    })
    throw new Error("Invalid email format")
  }

  // Drop malformed cc addresses rather than failing the send for everyone
  const validCc = data.cc?.filter((email) => {
    if (isValidEmail(email)) {
      return true
    }
    logger.error({
      email,
      error: "Invalid cc email format",
    })
    return false
  })

  try {
    await sendMail({
      body: template.body,
      cc: validCc,
      recipient: data.recipientEmail,
      subject: template.subject,
    })
  } catch (error) {
    logger.error({
      email: data.recipientEmail,
      error: `Failed to send ${emailType} email`,
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
    emailType: "invitation",
    template: templates.invitation(data),
  })
}

export async function sendLoginAlertEmail(
  data: LoginAlertEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "login alert",
    template: templates.loginAlert(data),
  })
}

export async function sendScheduledPageEmail(
  data: SchedulePageTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "scheduled page",
    template: templates.schedulePage(data),
  })
}

export async function sendCancelSchedulePageEmail(
  data: CancelSchedulePageTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "cancel scheduled page",
    template: templates.cancelSchedulePage(data),
  })
}

export async function sendFailedPublishEmail(
  data: FailedPublishTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "failed publish",
    template: templates.failedPublish(data),
  })
}

export async function sendSuccessfulPublishEmail(
  data: SuccessfulPublishTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "successful publish",
    template: templates.successfulPublish(data),
  })
}

export async function sendPublishAlertContentPublisherEmail(
  data: PublishAlertContentPublisherEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "publish alert content publisher",
    template: templates.publishAlertContentPublisher(data),
  })
}

export async function sendPublishAlertSiteAdminEmail(
  data: PublishAlertSiteAdminEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "publish alert site admin",
    template: templates.publishAlertSiteAdmin(data),
  })
}

export async function sendAccountDeactivationWarningEmail(
  data: AccountDeactivationWarningEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "account deactivation warning",
    template: templates.accountDeactivationWarning(data),
  })
}

export async function sendAccountDeactivationEmail(
  data: AccountDeactivationEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "account deactivation",
    template: templates.accountDeactivation(data),
  })
}

export async function sendGazetteDeletionEmail(
  data: GazetteDeletionEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "gazette deletion",
    template: templates.gazetteDeletion(data),
  })
}

export async function sendAuditLogExportReadyEmail(
  data: AuditLogExportReadyEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "audit log export ready",
    template: templates.auditLogExportReady(data),
  })
}

export async function sendAuditLogExportFailedEmail(
  data: AuditLogExportFailedEmailTemplateData,
): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "audit log export failed",
    template: templates.auditLogExportFailed(data),
  })
}
