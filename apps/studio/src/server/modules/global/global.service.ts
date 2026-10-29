import type { CentralNotificationBroadcast } from "@opengovsg/isomer-components"
import type { CentralNotification } from "~/schemas/global"
import { CENTRAL_NOTIFICATION_FILE_NAME } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { MOE_SITES } from "~/constants/misc"
import { env } from "~/env.mjs"
import {
  getTextObject,
  isConditionalWriteFailedError,
  putObjectDirect,
} from "~/lib/s3"
import { centralNotificationBroadcastValidator } from "~/schemas/global"

const { NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME } = env

const MALFORMED_MESSAGE = "The stored central notification is malformed"

interface GlobalNotificationState {
  notification: CentralNotification | null
  // S3 ETag, passed back on publish to detect concurrent edits
  version: string | null
}

export const getGlobalNotification =
  async (): Promise<GlobalNotificationState> => {
    let object: Awaited<ReturnType<typeof getTextObject>>
    try {
      object = await getTextObject(
        NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
        CENTRAL_NOTIFICATION_FILE_NAME,
      )
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to load the central notification",
        cause: error,
      })
    }

    if (!object) {
      return { notification: null, version: null }
    }

    let broadcast: unknown
    try {
      broadcast = JSON.parse(object.body)
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: MALFORMED_MESSAGE,
        cause: error,
      })
    }

    if (!centralNotificationBroadcastValidator(broadcast)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: MALFORMED_MESSAGE,
      })
    }

    const [entry] = broadcast

    return {
      notification: entry?.notification ?? null,
      version: object.eTag ?? null,
    }
  }

export const publishGlobalNotification = async ({
  notification,
  version,
}: GlobalNotificationState): Promise<void> => {
  // ponytail: one banner for the MOE pilot; per-entry targeting when more
  // agencies onboard. The file stays an array so sites need no change then.
  const broadcast: CentralNotificationBroadcast = notification
    ? [{ notification, targetSites: MOE_SITES }]
    : []

  try {
    await putObjectDirect({
      Bucket: NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
      Key: CENTRAL_NOTIFICATION_FILE_NAME,
      Body: JSON.stringify(broadcast),
      ContentType: "application/json",
      CacheControl: "no-cache, no-store, must-revalidate",
      // Reject the write if someone else published since this editor loaded
      ...(version ? { IfMatch: version } : { IfNoneMatch: "*" }),
    })
  } catch (error) {
    if (isConditionalWriteFailedError(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Someone else published the central notification. Reload to see the latest version.",
      })
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to publish the central notification",
      cause: error,
    })
  }
}
