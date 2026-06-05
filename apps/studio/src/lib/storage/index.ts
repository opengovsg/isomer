import { env } from "~/env.mjs"
import {
  deleteFile as s3DeleteFile,
  generateSignedGetUrl,
  generateSignedPutUrl,
} from "~/lib/s3"

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
  async getUploadConfig({
    contentType,
    contentDisposition,
  }: GetUploadConfigParams): Promise<UploadConfig> {
    return {
      provider: "vercel-blob",
      handleUploadUrl: "/api/blob/upload",
      contentType,
      contentDisposition,
    }
  }

  async getReadUrl(key: string): Promise<string> {
    return key.startsWith("https://") ? key : ""
  }

  async deleteFile(_key: string): Promise<void> {
    // No-op: Vercel Blob is preview-only, deletion isn't tracked
  }
}

export const assetStorage: AssetStorage =
  env.NEXT_PUBLIC_APP_ENV === "preview"
    ? new VercelBlobAssetStorage()
    : // env validation in env.mjs ensures this is set in non-preview environments
      new S3AssetStorage(env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME!)
