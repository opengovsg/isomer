import type { MicrosoftClarityProps } from "~/interfaces"

export const MicrosoftClarity = ({
  msClarityId,
  ScriptComponent,
}: MicrosoftClarityProps) => {
  return (
    <ScriptComponent
      id={`_next-ms-clarity-init-${msClarityId}`}
      strategy="afterInteractive" // next/script's default but just in case Vercel changes it in the future
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${msClarityId}");`,
      }}
    />
  )
}
