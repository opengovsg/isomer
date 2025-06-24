import type {
  GoogleTagManagerHeaderProps,
  GoogleTagManagerHeaderScriptProps,
} from "~/interfaces"

const GoogleTagManagerHeaderScript = ({
  gtmId,
  ScriptComponent,
}: GoogleTagManagerHeaderScriptProps) => {
  return (
    <ScriptComponent
      id={`_next-gtm-init-${gtmId}`}
      strategy="afterInteractive" // next/script's default but just in case Vercel changes it in the future
      src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
    />
  )
}

export const GoogleTagManagerHeader = ({
  siteGtmId,
  isomerGtmId,
  ScriptComponent,
}: GoogleTagManagerHeaderProps) => {
  return (
    <>
      {!!siteGtmId && (
        <GoogleTagManagerHeaderScript
          gtmId={siteGtmId}
          ScriptComponent={ScriptComponent}
        />
      )}
      {!!isomerGtmId && (
        <GoogleTagManagerHeaderScript
          gtmId={isomerGtmId}
          ScriptComponent={ScriptComponent}
        />
      )}
    </>
  )
}
