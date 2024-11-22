import type {
  GoogleTagManagerBodyProps,
  GoogleTagManagerBodyScriptProps,
} from "~/interfaces"
import { getIsomerGoogleTagManagerId } from "./utils"

// Needed in the event that the user has disabled scripts
const GoogleTagManagerBodyScript = ({
  gtmId,
}: GoogleTagManagerBodyScriptProps) => {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      ></iframe>
    </noscript>
  )
}

export const GoogleTagManagerBody = ({
  siteGtmId,
}: GoogleTagManagerBodyProps) => {
  const isomerGtmId: string | undefined = getIsomerGoogleTagManagerId()
  return (
    <>
      {siteGtmId && <GoogleTagManagerBodyScript gtmId={siteGtmId} />}
      {isomerGtmId && <GoogleTagManagerBodyScript gtmId={isomerGtmId} />}
    </>
  )
}
