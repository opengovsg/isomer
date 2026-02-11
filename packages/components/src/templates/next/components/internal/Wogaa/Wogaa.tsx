import type { WogaaProps } from "~/interfaces"

export const Wogaa = ({ environment }: WogaaProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://assets.wogaa.sg/scripts/wogaa.js"
      : "https://assets.dcube.cloud/scripts/wogaa.js"

  return <script src={scriptUrl} />
}
