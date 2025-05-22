import type { RoleType } from "~prisma/generated/generatedEnums"
import type { Resource } from "~prisma/generated/generatedTypes"

export interface BaseEmailTemplateData {
  recipientEmail: string
}

export interface InvitationEmailTemplateData extends BaseEmailTemplateData {
  inviterName: string
  siteName: string
  role: RoleType
  isSingpassEnabled?: boolean
}

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
