import type { Resource } from "~/server/modules/database"
import type { BulkSendAccountDeactivationWarningEmailsProps } from "~/server/modules/user/types"
import type { RoleType } from "~prisma/generated/generatedEnums"

export interface BaseEmailTemplateData {
  recipientEmail: string
  cc?: string[]
}

export interface InvitationEmailTemplateData extends BaseEmailTemplateData {
  inviterName: string
  siteName: string
  role: RoleType
  isSingpassEnabled?: boolean
}

export type LoginAlertEmailTemplateData = BaseEmailTemplateData

export interface PublishAlertContentPublisherEmailTemplateData extends BaseEmailTemplateData {
  siteName: string
  resource: Resource
}

export interface SchedulePageTemplateData extends BaseEmailTemplateData {
  resource: Resource
  scheduledAt: Date
}

export interface SuccessfulPublishTemplateData extends BaseEmailTemplateData {
  resource: Resource // the resource that was published
  isScheduled: boolean // whether the publish was scheduled or manual
}

export interface FailedPublishTemplateData extends BaseEmailTemplateData {
  isScheduled: boolean // whether the publish was scheduled or manual
  resource: Resource // the resource that failed to be published
}

export interface CancelSchedulePageTemplateData extends BaseEmailTemplateData {
  resource: Resource
}

export interface PublishAlertSiteAdminEmailTemplateData extends BaseEmailTemplateData {
  publisherEmail: string
  siteName: string
  resource: Resource
}

export interface AccountDeactivationWarningEmailTemplateData
  extends
    BaseEmailTemplateData,
    Pick<BulkSendAccountDeactivationWarningEmailsProps, "inHowManyDays"> {
  siteNames: string[]
}

export interface AccountDeactivationEmailTemplateData extends BaseEmailTemplateData {
  sitesAndAdmins: {
    siteName: string
    adminEmails: string[]
  }[]
}

export interface GazetteDeletionEmailTemplateData extends BaseEmailTemplateData {
  fileId: string
  gazetteTitle: string
}

export interface AuditLogExportDownloadLink {
  label: string
  url: string
}

export interface AuditLogExportReadyEmailTemplateData extends BaseEmailTemplateData {
  siteName: string
  // Human-readable month the export covers, e.g. "June 2026".
  month: string
  // One link for a single-report export, two for a "Both" export.
  links: AuditLogExportDownloadLink[]
}

export interface AuditLogExportFailedEmailTemplateData extends BaseEmailTemplateData {
  siteName: string
  month: string
}

export interface EmailTemplate {
  subject: string
  body: string
}

export type EmailTemplateFunction<T extends BaseEmailTemplateData> = (
  data: T,
) => EmailTemplate

export type EmailTemplateMap = Record<string, EmailTemplateFunction<never>>
