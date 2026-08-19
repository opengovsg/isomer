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
  /**
   * Category / Sub-category option ids resolved from `page.tagged`.
   * `null` means `tagged` held no id from the collection taxonomy, usually
   * because the row has not been backfilled since the tagCategories cutover.
   * Keep this nullable so every render site handles the unresolved case.
   */
  category: string | null
  subcategory: string | null
  status: GazetteStatus
  fileId: string
  fileKey: string | null
  fileSize: number | null
  publishTime: Date
  publishedAt: Date | null
}
