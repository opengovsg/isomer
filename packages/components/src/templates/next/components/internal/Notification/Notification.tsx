import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"
import BaseParagraph from "../BaseParagraph/BaseParagraph"
import NotificationClient from "./NotificationClient"

const Notification = ({
  content,
  title,
  LinkComponent,
  site,
}: NotificationProps) => {
  return (
    <NotificationClient title={title}>
      <BaseParagraph
        content={getTextAsHtml({ site, content })}
        className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0"
        LinkComponent={LinkComponent}
      />
    </NotificationClient>
  )
}

export default Notification
