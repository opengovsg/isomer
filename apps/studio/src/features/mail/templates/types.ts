import type { Resource } from "~/server/modules/database"
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

export type LoginAlertEmailTemplateData = BaseEmailTemplateData

export interface PublishAlertContentPublisherEmailTemplateData
  extends BaseEmailTemplateData {
  siteName: string
  resource: Resource
}

export interface PublishAlertSiteAdminEmailTemplateData
  extends BaseEmailTemplateData {
  publisherEmail: string
  siteName: string
  resource: Resource
}

export interface EmailTemplate {
  subject: string
  body: string
}
