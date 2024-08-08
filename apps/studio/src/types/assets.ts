export interface ModifiedAsset {
  path: string // Path to the asset property in the JSON schema
  src?: string // Original src of the asset
  file?: File
  blobUrl?: string
}
