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
      dangerouslySetInnerHTML={{
        // Note: we use j.defer instead of j.async to ensure the script is non-blocking
        // However, this means potentially losing some data of users who bounced really quickly (1-5% based on online articles),
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.defer=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');`,
      }}
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
