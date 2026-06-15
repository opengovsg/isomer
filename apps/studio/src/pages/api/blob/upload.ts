import type { NextApiRequest, NextApiResponse } from "next"
import type { SessionData } from "~/lib/types/session"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { getIronSession } from "iron-session"
import { env } from "~/env.mjs"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { assetStorage } from "~/lib/storage"
import { generateSessionOptions } from "~/server/modules/auth/session"

const ALLOWED_CONTENT_TYPES = [
  ...new Set([
    ...Object.values(IMAGE_ACCEPTED_MIME_TYPE_MAPPING),
    ...Object.values(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING),
  ]),
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NEXT_PUBLIC_STORAGE_PROVIDER !== "vercel-blob") {
    return res
      .status(403)
      .json({ error: "Only available for Vercel Blob provider" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const session = await getIronSession<SessionData>(
    req,
    res,
    generateSessionOptions({}),
  )
  if (!session.userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  await assetStorage.createUploadHandler(req, res, ALLOWED_CONTENT_TYPES)
}
