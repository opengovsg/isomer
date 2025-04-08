import type { VicaStylesheetProps } from "~/interfaces"

export const VicaStylesheet = ({ environment }: VicaStylesheetProps) => {
  const stylesheetUrl =
    environment === "production"
      ? "https://webchat.vica.gov.sg/static/css/chat.css"
      : "https://webchat.mol-vica.com/static/css/chat.css"

  return (
    <>
      <link href={stylesheetUrl} referrerPolicy="origin" rel="stylesheet" />
    </>
  )
}
