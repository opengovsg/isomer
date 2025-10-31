import type { VicaStylesheetProps } from "~/interfaces"

export const VicaStylesheet = ({
  useDevStagingScript,
}: VicaStylesheetProps) => {
  const stylesheetUrl = useDevStagingScript
    ? "https://webchat.mol-vica.com/static/css/chat.css"
    : "https://webchat.vica.gov.sg/static/css/chat.css"

  return (
    <>
      <link href={stylesheetUrl} referrerPolicy="origin" rel="stylesheet" />
    </>
  )
}
