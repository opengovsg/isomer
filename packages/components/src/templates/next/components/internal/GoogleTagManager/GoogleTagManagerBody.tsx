import type { GoogleTagManagerBodyProps } from "~/interfaces"

// Needed in the event that the user has disabled scripts
export const GoogleTagManagerBody = ({
  siteGtmId,
}: GoogleTagManagerBodyProps) => 
  (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(siteGtmId)}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        sandbox=""
        title="Google Tag Manager"
      />
    </noscript>
  )

