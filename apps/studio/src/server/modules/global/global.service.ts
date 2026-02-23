import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import { env } from "~/env.mjs"

const { NEXT_PUBLIC_S3_REGION, NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

const storage = new S3Client({
  region: NEXT_PUBLIC_S3_REGION,
})

const CENTRAL_NOTIFICATION_KEY = "central-notification.json"

export interface CentralNotificationEntry {
  notification: {
    title: string
    content?: unknown
  }
  targetSites: string[]
}

export type CentralNotificationBroadcast = CentralNotificationEntry[]

export const getGlobalNotification =
  async (): Promise<CentralNotificationBroadcast> => {
    try {
      const response = await storage.send(
        new GetObjectCommand({
          Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
          Key: CENTRAL_NOTIFICATION_KEY,
        }),
      )

      const body = await response.Body?.transformToString()
      if (!body) return []

      const data = JSON.parse(body) as CentralNotificationBroadcast
      return Array.isArray(data) ? data : []
    } catch (error) {
      // If the file doesn't exist yet, return empty array
      if (
        error instanceof Error &&
        "name" in error &&
        error.name === "NoSuchKey"
      ) {
        return []
      }
      throw error
    }
  }

export const publishGlobalNotification = async (
  data: CentralNotificationBroadcast,
): Promise<void> => {
  await storage.send(
    new PutObjectCommand({
      Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
      Key: CENTRAL_NOTIFICATION_KEY,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      CacheControl: "no-cache, no-store, must-revalidate",
    }),
  )
}
