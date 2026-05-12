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
  fileKey: string | null
  fileSize: number | null
  publishTime: Date
}
