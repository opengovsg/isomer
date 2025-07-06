import { exec } from "utils"

const LOCAL_ASSETS_PATH = "~/isomer/tooling/migrate-seed-isomer-next/assets"
// NOTE: inject this via env vars but not local assets
// because the path of local assets is not likely to change
// but we might want to seed a different bucket
const S3_URI = process.env.S3_URI
export const s3sync = async (siteId: number) => {
  const { stdout: logs } = await exec(
    `aws s3 sync ${LOCAL_ASSETS_PATH}/${siteId} ${S3_URI}/${siteId}`,
  )

  console.log(logs)
}
