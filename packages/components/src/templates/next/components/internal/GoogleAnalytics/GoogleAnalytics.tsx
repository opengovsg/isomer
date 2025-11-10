import type { GoogleAnalyticsScriptProps } from "~/interfaces/internal/GoogleAnalytics"

export const GoogleAnalytics = ({
  gaId,
  ScriptComponent,
  GoogleAnalyticsComponent,
}: GoogleAnalyticsScriptProps) => {
  if (GoogleAnalyticsComponent) {
    return <GoogleAnalyticsComponent gaId={gaId} />
  }

  return (
    <>
      <ScriptComponent
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <ScriptComponent id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
      </ScriptComponent>
    </>
  )
}
