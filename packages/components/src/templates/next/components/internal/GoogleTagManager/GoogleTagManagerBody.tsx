import type {
  GoogleTagManagerBodyProps,
  GoogleTagManagerBodyScriptProps,
} from "~/interfaces"

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
  isomerGtmId,
}: GoogleTagManagerBodyProps) => {
  return (
    <>
      {!!siteGtmId && <GoogleTagManagerBodyScript gtmId={siteGtmId} />}
      {!!isomerGtmId && <GoogleTagManagerBodyScript gtmId={isomerGtmId} />}
    </>
  )
}
