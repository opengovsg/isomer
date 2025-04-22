import { RoleType } from "~prisma/generated/generatedEnums"

import type {
  BaseEmailTemplateData,
  EmailTemplate,
  InvitationEmailTemplateData,
} from "./types"
import { env } from "~/env.mjs"

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

type EmailTemplateFunction<
  T extends BaseEmailTemplateData = BaseEmailTemplateData,
> = (data: T) => EmailTemplate

export const templates = {
  invitation:
    invitationTemplate satisfies EmailTemplateFunction<InvitationEmailTemplateData>,
} as const
