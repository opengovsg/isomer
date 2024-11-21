import type { GoogleTagManagerHeaderProps } from "~/interfaces"
import type { ScriptComponentType } from "~/types"
import {
  getIsomerGoogleTagManagerId,
  shouldNotIncludeGoogleTagManager,
} from "./utils"

const GoogleTagManagerHeaderScript = ({
  gtmId,
  ScriptComponent,
}: {
  gtmId: string
  ScriptComponent: ScriptComponentType
}) => {
  return (
    <ScriptComponent
      id={`_next-gtm-init-${gtmId}`}
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  )
}

export const GoogleTagManagerHeader = ({
  siteGtmId,
  ScriptComponent,
}: GoogleTagManagerHeaderProps) => {
  if (shouldNotIncludeGoogleTagManager()) return <></>

  const isomerGtmId: string | undefined = getIsomerGoogleTagManagerId()
  return (
    <>
      {siteGtmId && (
        <GoogleTagManagerHeaderScript
          gtmId={siteGtmId}
          ScriptComponent={ScriptComponent}
        />
      )}
      {isomerGtmId && (
        <GoogleTagManagerHeaderScript
          gtmId={isomerGtmId}
          ScriptComponent={ScriptComponent}
        />
      )}
    </>
  )
}
