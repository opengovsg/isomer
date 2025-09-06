import type {
  GoogleTagManagerProps,
  GoogleTagManagerScriptProps,
} from "~/interfaces"

// Needed in the event that the user has disabled scripts
const GoogleTagManagerBodyScript = ({ gtmId }: GoogleTagManagerScriptProps) => {
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
}: GoogleTagManagerProps) => {
  return (
    <>
      {!!siteGtmId && <GoogleTagManagerBodyScript gtmId={siteGtmId} />}
      {!!isomerGtmId && <GoogleTagManagerBodyScript gtmId={isomerGtmId} />}
    </>
  )
}
