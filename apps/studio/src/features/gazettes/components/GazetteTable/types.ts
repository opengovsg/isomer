export type GazetteStatus =
  | "published"
  | "scheduled"
  | "scanning"
  | "publish-failure"
  | "scanning-failure"
  | "parsing-failure"
  | "upload-failure"

export interface GazetteTableData {
  id: string
  notificationNo: string | null
  title: string
  category: string
  subcategory: string
  status: GazetteStatus
  fileId: string
  fileUrl: string | null
  publishTime: Date
}

export type GazetteTableSortOptions =
  | "publish-time-desc"
  | "publish-time-asc"
  | "notification-no-desc"
  | "notification-no-asc"
