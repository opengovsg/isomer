import { randomUUID } from "crypto"
import type { z } from "zod"

import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { generateSignedPutUrl } from "~/lib/s3"

export const getFileKey = ({
  siteId,
  fileName,
}: z.infer<typeof getPresignedPutUrlSchema>) => {
  // NOTE: We're using a random folder name to prevent collisions
  const folderName = randomUUID()

  return `${siteId}/${folderName}/${fileName}`
}

export const getPresignedPutUrl = async ({ key }: { key: string }) => {
  return generateSignedPutUrl({
    Key: key,
  })
}
