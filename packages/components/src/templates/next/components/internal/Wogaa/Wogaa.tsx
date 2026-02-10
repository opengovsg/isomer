import type { WogaaProps } from "~/interfaces"
import { PreloadHelper } from "../utils"

export const Wogaa = ({
  environment,
  ScriptComponent = "script",
}: WogaaProps) => {
  const origin =
    environment === "production"
      ? "https://assets.wogaa.sg"
      : "https://assets.dcube.cloud"

  return (
    <>
      {/* preload the CDN origin so the script fetch starts sooner */}
      <PreloadHelper href={origin} />

      {/* setting beforeInteractive to ensure we do not lose analytical data */}
      <ScriptComponent
        src={`${origin}/scripts/wogaa.js`}
        strategy="beforeInteractive"
        fetchPriority="high"
      />
    </>
  )
}
