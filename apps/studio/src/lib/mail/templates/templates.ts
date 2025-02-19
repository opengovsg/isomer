import { RoleType } from "~prisma/generated/generatedEnums"

import type { EmailTemplate, InvitationEmailTemplateData } from "./types"
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
      const _exhaustiveCheck: never = data.role
      throw new Error(`Unknown role. Please check the role type.`)
  }

  return {
    subject: `[Isomer] Join your team to edit ${data.siteName} on Isomer Studio`,
    body: `
<p>Hi ${data.recipientEmail},</p>
<p>You’re invited to edit ${data.siteName} on Isomer Studio as a ${data.role}. As a ${data.role}, you can ${roleAction}.</p>
<p></p>
<p><a target="_blank" href="${env.NEXT_PUBLIC_APP_URL}">Log in to Isomer Studio to confirm your email and view your Isomer site.</a></p>
<p></p>
<p>Best,</p>
<p>Isomer team</p>
`.trim(),
  }
}

export const templates = {
  invitation: invitationTemplate,
}
