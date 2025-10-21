import type { WogaaProps } from "~/interfaces"

export const Wogaa = ({
  environment,
  ScriptComponent = "script",
}: WogaaProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://assets.wogaa.sg/scripts/wogaa.js"
      : "https://assets.dcube.cloud/scripts/wogaa.js"

  return <ScriptComponent src={scriptUrl} strategy="beforeInteractive" />
}
