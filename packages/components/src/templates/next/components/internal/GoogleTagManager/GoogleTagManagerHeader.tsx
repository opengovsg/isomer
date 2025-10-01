import type {
  GoogleTagManagerHeaderProps,
  GoogleTagManagerHeaderScriptProps,
} from "~/interfaces"

const GoogleTagManagerHeaderScript = ({
  gtmId,
  usePartytown = false,
  ScriptComponent,
}: GoogleTagManagerHeaderScriptProps) => {
  return (
    <ScriptComponent
      id={`_next-gtm-init-${gtmId}`}
      strategy="afterInteractive" // next/script's default but just in case Vercel changes it in the future
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');`,
      }}
      {...(usePartytown ? { type: "text/partytown" } : {})}
    />
  )
}

export const GoogleTagManagerHeader = ({
  siteGtmId,
  isomerGtmId,
  ...rest
}: GoogleTagManagerHeaderProps) => {
  return (
    <>
      {!!siteGtmId && (
        <GoogleTagManagerHeaderScript gtmId={siteGtmId} {...rest} />
      )}
      {!!isomerGtmId && (
        <GoogleTagManagerHeaderScript gtmId={isomerGtmId} {...rest} />
      )}
    </>
  )
}
