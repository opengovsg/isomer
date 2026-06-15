import type { HandleUploadBody } from "@vercel/blob/client"
import type { NextApiRequest, NextApiResponse } from "next"
import { head } from "@vercel/blob"
import { handleUpload } from "@vercel/blob/client"
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
  createUploadHandler(
    req: NextApiRequest,
    res: NextApiResponse,
    allowedContentTypes: string[],
  ): Promise<void>
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

  async createUploadHandler(
    _req: NextApiRequest,
    res: NextApiResponse,
    _allowedContentTypes: string[],
  ): Promise<void> {
    res.status(405).json({ error: "Not applicable for S3 provider" })
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

  async getReadUrl(key: string): Promise<string> {
    if (key.startsWith("https://")) {
      return key
    }
    const blob = await head(key)
    return blob.url
  }

  deleteFile(_key: string): Promise<void> {
    // No-op: Vercel Blob is preview-only, deletion isn't tracked
    return Promise.resolve()
  }

  async createUploadHandler(
    req: NextApiRequest,
    res: NextApiResponse,
    allowedContentTypes: string[],
  ): Promise<void> {
    try {
      const jsonResponse = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req,
        onBeforeGenerateToken: () =>
          Promise.resolve({
            allowedContentTypes,
            maximumSizeInBytes: 50 * 1024 * 1024,
            allowOverwrite: true,
          }),
        onUploadCompleted: () => Promise.resolve(),
      })
      res.status(200).json(jsonResponse)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
}

export const assetStorage: AssetStorage =
  env.NEXT_PUBLIC_STORAGE_PROVIDER === "vercel-blob"
    ? new VercelBlobAssetStorage()
    : // env validation in env.mjs ensures this is set in non-vercel-blob environments
      new S3AssetStorage(env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME ?? "")
