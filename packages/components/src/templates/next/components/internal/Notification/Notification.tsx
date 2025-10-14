import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"
import NotificationClient from "./NotificationClient"

const Notification = ({
  content,
  title,
  LinkComponent,
  site,
}: NotificationProps) => {
  return (
    <NotificationClient
      title={title}
      content={getTextAsHtml({ site, content })}
      LinkComponent={LinkComponent}
    />
  )
}

export default Notification
