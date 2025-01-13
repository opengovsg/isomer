import type { VicaProps } from "~/interfaces"

export const VicaStylesheet = () => {
  return (
    <>
      <link
        href="https://webchat.vica.gov.sg/static/css/chat.css"
        referrerPolicy="origin"
        rel="stylesheet"
      />
    </>
  )
}

export const VicaWidget = ({
  ScriptComponent = "script",
  ...props
}: VicaProps) => {
  return (
    <>
      <ScriptComponent
        async
        type="text/javascript"
        src="https://webchat.vica.gov.sg/static/js/chat.js"
        referrerPolicy="origin"
        // 'lazyOnload' is recommended by Next.js for chat widgets
        // Reference: https://nextjs.org/docs/pages/api-reference/components/script#lazyonload
        strategy="lazyOnload"
      />
      <div
        id="webchat"
        {...props}
        app-font-family="Inter, system-ui, sans-serif"
        // NOTE: Clarifying with VICA regarding color scheme
        // Once confirmed, will override with site's color scheme for consistency
      />
    </>
  )
}
