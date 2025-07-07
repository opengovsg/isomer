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

export interface AccountDeactivationWarningEmailTemplateData
  extends BaseEmailTemplateData {
  siteNames: string[]
  inHowManyDays: 1 | 7 | 14 // note: this is arbitrarily set to when we want to remind users to log in
}

export interface AccountDeactivationEmailTemplateData
  extends BaseEmailTemplateData {
  sitesAndAdmins: {
    siteName: string
    adminEmails: string[]
  }[]
}

export interface EmailTemplate {
  subject: string
  body: string
}
