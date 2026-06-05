import type { HandleUploadBody } from "@vercel/blob/client"
import type { NextApiRequest, NextApiResponse } from "next"
import type { SessionData } from "~/lib/types/session"
import { handleUpload } from "@vercel/blob/client"
import { getIronSession } from "iron-session"
import { env } from "~/env.mjs"
import { generateSessionOptions } from "~/server/modules/auth/session"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (env.NEXT_PUBLIC_APP_ENV !== "preview") {
    return res.status(403).json({ error: "Only available in preview" })
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

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: () =>
        Promise.resolve({
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "application/pdf",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          allowOverwrite: true,
        }),
      onUploadCompleted: () => Promise.resolve(),
    })
    return res.status(200).json(jsonResponse)
  } catch (error) {
    return res.status(400).json({ error: String(error) })
  }
}
