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
   * Category / Sub-category option uuids resolved out of `page.tagged` by
   * option-uuid membership. `null` means `tagged` held no uuid matching the
   * collection's taxonomy — a row that predates the tagCategories cutover and
   * has not been backfilled. Deliberately nullable rather than `""` so the
   * unresolved case has to be handled at every render site.
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
