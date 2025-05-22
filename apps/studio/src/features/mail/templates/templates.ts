import { RoleType } from "~prisma/generated/generatedEnums"

import type {
  BaseEmailTemplateData,
  EmailTemplate,
  InvitationEmailTemplateData,
  PublishAlertContentPublisherEmailTemplateData,
  PublishAlertSiteAdminEmailTemplateData,
} from "./types"
import { ISOMER_SUPPORT_EMAIL, ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { env } from "~/env.mjs"
import { getResourceStudioUrl } from "~/utils/resources"

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
<p>To start editing, log in to Isomer Studio and activate your account: <a target="_blank" href="${env.NEXT_PUBLIC_APP_URL}">${env.NEXT_PUBLIC_APP_URL?.replace("https://", "")}</a></p>`,
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

export const publishAlertContentPublisherTemplate = (
  data: PublishAlertContentPublisherEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, siteName, resource } = data
  const resourceStudioUrl = getResourceStudioUrl(resource)

  return {
    subject: `[Isomer Studio] ${resource.title} has been published`,
    body: `<p>Hi ${recipientEmail},</p>
<p>You have successfully published "${resource.title}" on ${siteName}. You can access your published content on Isomer Studio at <a href="${resourceStudioUrl}">${resourceStudioUrl}</a>.</p>
<p><strong>Note:</strong> You're receiving this notification because content was published during a Singpass authentication outage. If you didn't authorize this publication, please contact <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> immediately.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

export const publishAlertSiteAdminTemplate = (
  data: PublishAlertSiteAdminEmailTemplateData,
): EmailTemplate => {
  const { recipientEmail, publisherEmail, siteName, resource } = data
  const resourceStudioUrl = getResourceStudioUrl(resource)

  return {
    subject: `[Isomer Studio] ${resource.title} has been published`,
    body: `<p>Hi ${recipientEmail},</p>
<p>${publisherEmail} has published "${resource.title}" on ${siteName}. You can view the published content on Isomer Studio at <a href="${resourceStudioUrl}">${resourceStudioUrl}</a>.</p>
<p><strong>Note:</strong> You're receiving this notification because content was published during a Singpass authentication outage. As a site admin, we want to keep you informed of all publishing activities. If you have any concerns, please contact <a href="${ISOMER_SUPPORT_LINK}">${ISOMER_SUPPORT_EMAIL}</a> immediately.</p>
<p>Best,</p>
<p>Isomer team</p>`,
  }
}

type EmailTemplateFunction<
  T extends BaseEmailTemplateData = BaseEmailTemplateData,
> = (data: T) => EmailTemplate

export const templates = {
  invitation:
    invitationTemplate satisfies EmailTemplateFunction<InvitationEmailTemplateData>,
  publishAlertContentPublisher:
    publishAlertContentPublisherTemplate satisfies EmailTemplateFunction<PublishAlertContentPublisherEmailTemplateData>,
  publishAlertSiteAdmin:
    publishAlertSiteAdminTemplate satisfies EmailTemplateFunction<PublishAlertSiteAdminEmailTemplateData>,
} as const
