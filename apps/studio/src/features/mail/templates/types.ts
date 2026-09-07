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

// Sent when a CodeBuild job completes successfully — the only call site
// (webhook.utils.ts) doesn't know whether the build was triggered by a
// publish or an unpublish, so this covers both.
export interface SiteUpdatedTemplateData extends BaseEmailTemplateData {
  resource: Resource // the resource whose change triggered the site update
  isScheduled: boolean // whether the triggering action was scheduled or manual
}

// Sent when a CodeBuild job fails — same ambiguity as SiteUpdatedTemplateData
// above: the only call site (webhook.utils.ts) doesn't know if the build was
// triggered by a publish or an unpublish.
export interface SiteUpdateFailedTemplateData extends BaseEmailTemplateData {
  isScheduled: boolean // whether the triggering action was scheduled or manual
  resource: Resource // the resource whose change triggered the failed build
}

export interface FailedPublishTemplateData extends BaseEmailTemplateData {
  isScheduled: boolean // whether the publish was scheduled or manual
  resource: Resource // the resource that failed to be published
}

export interface FailedUnpublishTemplateData extends BaseEmailTemplateData {
  isScheduled: boolean // whether the unpublish was scheduled or manual
  resource: Resource // the resource that failed to be unpublished
}

export interface FailedSiteRebuildTemplateData extends BaseEmailTemplateData {
  // whether the page-level action that succeeded was a publish or unpublish —
  // distinct from FailedPublish/FailedUnpublish, which are for when that
  // action itself failed. Here it succeeded; only the site rebuild didn't.
  verb: "publish" | "unpublish"
  resource: Resource
}

export interface CancelSchedulePageTemplateData extends BaseEmailTemplateData {
  resource: Resource
}

export interface ScheduleUnpublishTemplateData extends BaseEmailTemplateData {
  resource: Resource
  scheduledAt: Date
}

export interface CancelScheduleUnpublishTemplateData extends BaseEmailTemplateData {
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
  label: "access" | "audit"
  url: string
}

export interface AuditLogExportReadyEmailTemplateData extends BaseEmailTemplateData {
  siteName: string
  // Human-readable month the export covers, e.g. "June 2026".
  month: string
  // Each export job produces exactly one report, so exactly one link.
  link: AuditLogExportDownloadLink
  sizeInBytes: number | null
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
