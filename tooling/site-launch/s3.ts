import { exec } from "utils"

import { env } from "./env"

// NOTE: inject this via env vars but not local assets
// because the path of local assets is not likely to change
// but we might want to seed a different bucket
const S3_BUCKET_URI = env.S3_BUCKET_URI
export const s3sync = async (siteId: number) => {
  const { stdout: logs } = await exec(
    `aws s3 sync ../migrate-seed-isomer-next/assets/${siteId} ${S3_BUCKET_URI}/${siteId}`,
  )

  console.log(logs)
}
