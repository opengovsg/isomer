import type { GoogleTagManagerBodyProps } from "~/interfaces"

// Needed in the event that the user has disabled scripts
export const GoogleTagManagerBody = ({
  siteGtmId,
}: GoogleTagManagerBodyProps) => {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${siteGtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      ></iframe>
    </noscript>
  )
}
