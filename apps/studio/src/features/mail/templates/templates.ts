import { RoleType } from "~prisma/generated/generatedEnums"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

import type {
  AccountDeactivationEmailTemplateData,
  AccountDeactivationWarningEmailTemplateData,
  BaseEmailTemplateData,
  CancelSchedulePageTemplateData,
  EmailTemplate,
  InvitationEmailTemplateData,
  LoginAlertEmailTemplateData,
  PublishAlertContentPublisherEmailTemplateData,
  PublishAlertSiteAdminEmailTemplateData,
  SchedulePageTemplateData,
} from "./types"
import { ISOMER_SUPPORT_EMAIL, ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { env } from "~/env.mjs"
import { MAX_DAYS_FROM_LAST_LOGIN } from "~/server/modules/user/constants"
import { getStudioResourceUrl } from "~/utils/resources"

const constructStudioRedirect = () =>
  `<a target="_blank" href="${env.NEXT_PUBLIC_APP_URL}">${env.NEXT_PUBLIC_APP_URL?.replace("https://", "")}</a>`

export const invitationTemplate = (
  data: InvitationEmailTemplateData,
): EmailTemplate => {
  let roleAction: string
  switch (data.role) {
    case RoleType.Admin:
      roleAction =
        "edit and publish the content, as well as manage users and site settings"
      break
    case RoleType.Publisher:
      roleAction = "edit and publish content"
      break
    case RoleType.Editor:
      roleAction = "edit content"
      break
    default:
      const _: never = data.role
      throw new Error(`Unknown role. Please check the role type.`)
  }

  const { inviterName, recipientEmail, siteName, role, isSingpassEnabled } =
    data

  const emailBodyParts = [
    `<p>Hi ${recipientEmail},</p>
<p>${inviterName} has invited you to edit ${siteName} on Isomer Studio as ${role}. As a ${role}, you can ${roleAction}.</p>
<p></p>
<p>To start editing, log in to Isomer Studio and activate your account: ${constructStudioRedirect()}</p>`,
    ...(isSingpassEnabled
      ? [
          `<p>You will need to set up Two-Factor Authentication (2FA) using Singpass. Please have your Singpass ready to complete activation.</p>`,
        ]
      : []),
    `<p>Best,</p>
<p>Isomer team</p>`,
  ]

  return {
    subject: "[Isomer Studio] Activate your account to edit Isomer sites",
    body: emailBodyParts.join("<p></p>").trim(),
  }
}

// FYI: Currently, we only send this email to users when Singpass has been disabled.
export const loginAlertTemplate = (
  data: LoginAlertEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail } = data
  return {
    subject: `[Isomer Studio] Successful Login to Your Account`,
    body: `<p>Hi ${recipientEmail},</p>
<p>We wanted to let you know that your account was accessed successfully.</p>
<p>If this was you, no action is needed.</p>
<p><strong>Note:</strong> You're receiving this notification because your account was logged into during a Singpass authentication outage. If you are not the one who logged in, please contact <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> immediately.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const schedulePageTemplate = (
  data: SchedulePageTemplateData,
): EmailTemplate => {
  const { recipientEmail, resource, scheduledAt } = data
  const scheduledAtTimezone = format(
    toZonedTime(scheduledAt, "Asia/Singapore"),
    "MMMM d, yyyy hh:mm a",
  )
  return {
    subject: `[Isomer Studio] You scheduled ${resource.title} to be published`,
    body: `<p>Hi ${recipientEmail},</p>
<p>You’ve scheduled a page to be published at a later time. Your page will publish at: <strong>${scheduledAtTimezone}</strong>.</p>
<p>Log in to Isomer Studio at ${constructStudioRedirect()} to change or cancel this.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const cancelSchedulePageTemplate = (
  data: CancelSchedulePageTemplateData,
): EmailTemplate => {
  const { recipientEmail, resource } = data
  return {
    subject: `[Isomer Studio] Your scheduled publish for ${resource.title} has been cancelled`,
    body: `<p>Hi ${recipientEmail},</p>
<p>Your scheduled publish for ${resource.title} has been cancelled.</p>
<p>Log in to Isomer Studio at ${constructStudioRedirect()} to manage your content.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const failedSchedulePublishTemplate = (
  data: BaseEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail } = data
  return {
    subject: `[Isomer Studio] We couldn’t publish your page that was scheduled`,
    body: `<p>Hi ${recipientEmail},</p>
    <p>We couldn’t publish the page that you scheduled. Please log in to Isomer Studio at ${constructStudioRedirect()} and try publishing the page again.</p>
    <p>Best,</p>
    <p>Isomer team</p>`,
  }
}

export const publishAlertContentPublisherTemplate = (
  data: PublishAlertContentPublisherEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, siteName, resource } = data
  const studioResourceUrl = getStudioResourceUrl(resource)

  return {
    subject: `[Isomer Studio] ${resource.title} has been published`,
    body: `<p>Hi ${recipientEmail},</p>
<p>You have successfully published "${resource.title}" on ${siteName}. You can access your published content on Isomer Studio at <a href="${studioResourceUrl}">${studioResourceUrl}</a>.</p>
<p><strong>Note:</strong> You're receiving this notification because content was published during a Singpass authentication outage. If you didn't authorize this publication, please contact <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> immediately.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const publishAlertSiteAdminTemplate = (
  data: PublishAlertSiteAdminEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, publisherEmail, siteName, resource } = data
  const studioResourceUrl = getStudioResourceUrl(resource)

  return {
    subject: `[Isomer Studio] ${resource.title} has been published`,
    body: `<p>Hi ${recipientEmail},</p>
<p>${publisherEmail} has published "${resource.title}" on ${siteName}. You can view the published content on Isomer Studio at <a href="${studioResourceUrl}">${studioResourceUrl}</a>.</p>
<p><strong>Note:</strong> You're receiving this notification because content was published during a Singpass authentication outage. As a site admin, we want to keep you informed of all publishing activities. If you have any concerns, please contact <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> immediately.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const accountDeactivationWarningTemplate = (
  data: AccountDeactivationWarningEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, siteNames, inHowManyDays } = data
  return {
    subject: `[Isomer Studio] Account deactivation warning - ${inHowManyDays} days remaining`,
    body: `<p>Hi ${recipientEmail},</p>
<p>We noticed you haven’t logged in for a while. To keep your account active, please log in within the next ${inHowManyDays} days at ${constructStudioRedirect()}.</p>
<p>This is a standard security measure to protect your sites and data.</p>
<p>If your account becomes deactivated, you will lose access to the following sites:</p>
<ul>${siteNames.map((site) => `<li>${site}</li>`).join("")}</ul>
<p>Your content will still be preserved, but you won’t be able to access or manage these sites unless your account is reactivated.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const accountDeactivationTemplate = (
  data: AccountDeactivationEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, sitesAndAdmins } = data

  const siteSpecificInstructions = sitesAndAdmins
    .map(({ siteName, adminEmails }) => {
      if (adminEmails.length > 0) {
        return `
          <p><b>${siteName}</b></p>
          <p>To regain access, please contact one of your site's administrators:</p>
          <ul>${adminEmails.map((email) => `<li>${email}</li>`).join("")}</ul>
        `
      }
      return `
        <p><b>${siteName}</b></p>
        <p>There are no administrators for this site. To be added back, please send an email to <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> with your line manager in CC for approval.</p>
      `
    })
    .join("")

  const emailBody = [
    `<p>Hi ${recipientEmail},</p>`,
    `<p>Your Isomer Studio account has been removed as you have not logged in for over ${MAX_DAYS_FROM_LAST_LOGIN} days. This is a standard security measure to protect your site data.</p>`,
    `<p>Your content and previous contributions have been preserved. Your site(s) will continue to be accessible to visitors, and all your work remains intact.</p>`,
    `<p>To regain access to your site(s), please follow the instructions below:</p>`,
    siteSpecificInstructions,
    `<p>Best,</p>`,
    `<p>Isomer team</p>`,
  ].join("")

  return {
    subject: `[Isomer Studio] Your account has been deactivated due to inactivity`,
    body: emailBody,
  }
}

type EmailTemplateFunction<
  T extends BaseEmailTemplateData = BaseEmailTemplateData,
> = (data: T) => EmailTemplate

export const templates = {
  invitation:
    invitationTemplate satisfies EmailTemplateFunction<InvitationEmailTemplateData>,
  loginAlert:
    loginAlertTemplate satisfies EmailTemplateFunction<LoginAlertEmailTemplateData>,
  publishAlertContentPublisher:
    publishAlertContentPublisherTemplate satisfies EmailTemplateFunction<PublishAlertContentPublisherEmailTemplateData>,
  cancelSchedulePage:
    cancelSchedulePageTemplate satisfies EmailTemplateFunction<CancelSchedulePageTemplateData>,
  failedSchedulePublish:
    failedSchedulePublishTemplate satisfies EmailTemplateFunction<BaseEmailTemplateData>,
  schedulePage:
    schedulePageTemplate satisfies EmailTemplateFunction<SchedulePageTemplateData>,
  publishAlertSiteAdmin:
    publishAlertSiteAdminTemplate satisfies EmailTemplateFunction<PublishAlertSiteAdminEmailTemplateData>,
  accountDeactivationWarning:
    accountDeactivationWarningTemplate satisfies EmailTemplateFunction<AccountDeactivationWarningEmailTemplateData>,
  accountDeactivation:
    accountDeactivationTemplate satisfies EmailTemplateFunction<AccountDeactivationEmailTemplateData>,
} as const
