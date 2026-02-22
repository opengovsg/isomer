import type { WogaaProps } from "~/interfaces"

export const Wogaa = ({ environment }: WogaaProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://assets.wogaa.sg/scripts/wogaa.js"
      : "https://assets.dcube.cloud/scripts/wogaa.js"

  // NOTE: next/script works by injecting the script tag into the head during runtime
  // however, Wogaa require their script to be present in the head
  // as such, we cannot use next/script and need to use a regular script tag
  return (
    <script
      src={scriptUrl}
      type="text/javascript"
      crossOrigin="anonymous"
      async
    />
  )
}
