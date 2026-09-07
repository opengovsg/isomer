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
// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
async function sendEmailWithTemplate($2): Promise<void> {
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

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendInvitation($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "invitation",
    template: templates.invitation(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendLoginAlertEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "login alert",
    template: templates.loginAlert(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendScheduledPageEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "scheduled page",
    template: templates.schedulePage(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendCancelSchedulePageEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "cancel scheduled page",
    template: templates.cancelSchedulePage(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendFailedPublishEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "failed publish",
    template: templates.failedPublish(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendSuccessfulPublishEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "successful publish",
    template: templates.successfulPublish(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendPublishAlertContentPublisherEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "publish alert content publisher",
    template: templates.publishAlertContentPublisher(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendPublishAlertSiteAdminEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "publish alert site admin",
    template: templates.publishAlertSiteAdmin(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendAccountDeactivationWarningEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "account deactivation warning",
    template: templates.accountDeactivationWarning(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendAccountDeactivationEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "account deactivation",
    template: templates.accountDeactivation(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendGazetteDeletionEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "gazette deletion",
    template: templates.gazetteDeletion(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendAuditLogExportReadyEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "audit log export ready",
    template: templates.auditLogExportReady(data),
  })
}

// oxlint-disable-next-line eslint/func-style -- core cleanup deferred
export async function sendAuditLogExportFailedEmail($2): Promise<void> {
  await sendEmailWithTemplate({
    data,
    emailType: "audit log export failed",
    template: templates.auditLogExportFailed(data),
  })
}
