import type { RoleType } from "~prisma/generated/generatedEnums"

interface EmailTemplateData {
  recipientEmail: string
}

export interface InvitationEmailTemplateData extends EmailTemplateData {
  siteName: string
  role: RoleType
}

export interface EmailTemplate {
  subject: string
  body: string
}
