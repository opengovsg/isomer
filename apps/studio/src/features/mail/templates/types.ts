import type { RoleType } from "~prisma/generated/generatedEnums"

export interface BaseEmailTemplateData {
  recipientEmail: string
}

export interface InvitationEmailTemplateData extends BaseEmailTemplateData {
  inviterName: string
  siteName: string
  role: RoleType
  isSingpassEnabled?: boolean
}

export interface PublishingNotificationEmailTemplateData
  extends BaseEmailTemplateData {
  siteName: string
}

export interface EmailTemplate {
  subject: string
  body: string
}
