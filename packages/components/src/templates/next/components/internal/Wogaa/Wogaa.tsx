import type { WogaaProps } from "~/interfaces"

export const Wogaa = ({
  environment,
  ScriptComponent = "script",
}: WogaaProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://assets.wogaa.sg/scripts/wogaa.js"
      : "https://assets.dcube.cloud/scripts/wogaa.js"

  // Wogaa needs to be loaded before the page loads so that it can track the page view
  // While default recommendation is afterInteractive, it actually affected WOGAA's tracking
  return <ScriptComponent src={scriptUrl} strategy="beforeInteractive" />
}
