import type { RoleType } from "~prisma/generated/generatedEnums"

export interface BaseEmailTemplateData {
  recipientEmail: string
}

export interface InvitationEmailTemplateData extends BaseEmailTemplateData {
  siteName: string
  role: RoleType
}

export interface EmailTemplate {
  subject: string
  body: string
}
