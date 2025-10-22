import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"
import { Prose } from "../../native"
import { hasContent } from "../../native/Prose/utils"
import BaseParagraph from "../BaseParagraph"
import NotificationClient from "./NotificationClient"

const Notification = ({
  content,
  title,
  LinkComponent,
  site,
}: NotificationProps) => {
  const Paragraph = () =>
    content instanceof Array ? (
      <BaseParagraph
        content={getTextAsHtml({ site, content })}
        className="prose-body-base"
        LinkComponent={LinkComponent}
      />
    ) : (
      !!content &&
      hasContent(content.content) && (
        <Prose {...content} site={site} LinkComponent={LinkComponent} />
      )
    )

  return (
    <NotificationClient title={title}>
      <Paragraph />
    </NotificationClient>
  )
}

export default Notification
