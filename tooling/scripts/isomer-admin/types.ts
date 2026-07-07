export interface ResourceRow {
  id: string
  permalink: string
  content: object
}

export interface ResourceRowWithSite {
  id: string
  siteId: string
  content: object
}

export interface ResourceRowWithSiteAndTitle {
  id: string
  title: string
  siteId: string
  content: object
}

export type IsomerAdminScriptType =
  | "bulk-upload-assets"
  | "check-uptimerobot-monitors"
  | "export-individual-jsons"
  | "export-site-jsons"
  | "extract-folder-jsons"
  | "find-invalid-schema"
  | "import-folder-jsons"
  | "publish-site-resources"
  | "rebuild-all-codebuild-projects"
