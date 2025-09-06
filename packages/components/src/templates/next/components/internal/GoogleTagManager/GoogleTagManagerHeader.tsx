import type {
  GoogleTagManagerProps,
  GoogleTagManagerScriptProps,
} from "~/interfaces"

const GoogleTagManagerHeaderScript = ({
  gtmId,
}: GoogleTagManagerScriptProps) => {
  return (
    <script
      id={`_next-gtm-init-${gtmId}`}
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');`,
      }}
      type="text/partytown"
    />
  )
}

export const GoogleTagManagerHeader = ({
  siteGtmId,
  isomerGtmId,
}: GoogleTagManagerProps) => {
  return (
    <>
      {!!siteGtmId && <GoogleTagManagerHeaderScript gtmId={siteGtmId} />}
      {!!isomerGtmId && <GoogleTagManagerHeaderScript gtmId={isomerGtmId} />}
    </>
  )
}
