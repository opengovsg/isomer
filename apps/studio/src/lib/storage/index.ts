import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import {
  deleteFile as s3DeleteFile,
  generateSignedGetUrl,
  generateSignedPutUrl,
} from "~/lib/s3"

const logger = createBaseLogger({ path: "lib/storage" })

export type UploadConfig =
  | {
      provider: "s3"
      presignedPutUrl: string
      contentType: string
      contentDisposition: string
    }
  | {
      provider: "vercel-blob"
      handleUploadUrl: string
      contentType: string
      contentDisposition: string
    }

interface GetUploadConfigParams {
  key: string
  contentType: string
  contentDisposition: string
  tags?: { key: string; value: string }[]
}

interface AssetStorage {
  getUploadConfig(params: GetUploadConfigParams): Promise<UploadConfig>
  getReadUrl(key: string): Promise<string>
  deleteFile(key: string): Promise<void>
}

class S3AssetStorage implements AssetStorage {
  constructor(private readonly bucket: string) {}

  async getUploadConfig({
    key,
    contentType,
    contentDisposition,
    tags,
  }: GetUploadConfigParams): Promise<UploadConfig> {
    const tagging = tags?.map(({ key, value }) => `${key}=${value}`).join("&")
    const presignedPutUrl = await generateSignedPutUrl({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentDisposition: contentDisposition,
      Tagging: tagging,
    })
    return { provider: "s3", presignedPutUrl, contentType, contentDisposition }
  }

  async getReadUrl(key: string): Promise<string> {
    return generateSignedGetUrl({ Bucket: this.bucket, Key: key })
  }

  async deleteFile(key: string): Promise<void> {
    await s3DeleteFile({ Key: key, Bucket: this.bucket })
  }
}

class VercelBlobAssetStorage implements AssetStorage {
  getUploadConfig({
    contentType,
    contentDisposition,
  }: GetUploadConfigParams): Promise<UploadConfig> {
    // `tags` (e.g. the S3 `scheduledAt` tag) is intentionally dropped: Vercel
    // Blob has no tagging, and scheduled-publishing tag operations are no-op'd
    // in preview, so no scheduling metadata is expected to survive here.
    return Promise.resolve({
      provider: "vercel-blob",
      handleUploadUrl: "/api/blob/upload",
      contentType,
      contentDisposition,
    })
  }

  getReadUrl(key: string): Promise<string> {
    if (key.startsWith("https://")) {
      return Promise.resolve(key)
    }
    // Vercel Blob keys are stored as full blob URLs. A non-URL key (e.g. a
    // legacy/seeded asset path) can't be resolved here and renders as an empty
    // `src`; log it so the broken image is debuggable rather than mysterious.
    logger.warn({
      message: "Unable to resolve Vercel Blob read URL for non-URL key",
      key,
    })
    return Promise.resolve("")
  }

  deleteFile(_key: string): Promise<void> {
    // No-op: Vercel Blob is preview-only, deletion isn't tracked
    return Promise.resolve()
  }
}

export const assetStorage: AssetStorage =
  env.NEXT_PUBLIC_APP_ENV === "preview"
    ? new VercelBlobAssetStorage()
    : // env validation in env.mjs ensures this is set in non-preview environments
      new S3AssetStorage(env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME ?? "")
