import type { GoogleTagManagerHeaderProps } from "~/interfaces"

import { serializeForInlineScript } from "@isomer/validators"

export const GoogleTagManagerHeader = ({
  siteGtmId,
  ScriptComponent,
}: GoogleTagManagerHeaderProps) => {
  if (ScriptComponent === undefined || ScriptComponent === null) {
    return null
  }

  const sanitizedGtmId = serializeForInlineScript(siteGtmId)

  return (
    <ScriptComponent
      id={`_next-gtm-init-${siteGtmId}`}
      // next/script's default but just in case Vercel changes it in the future
      strategy="afterInteractive"
      // oxlint-disable-next-line react/no-danger -- GTM bootstrap snippet must run as inline script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',${sanitizedGtmId});`,
      }}
    />
  )
}
