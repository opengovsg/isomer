import type {
  NotificationProps,
  NotificationTitleContentConfig,
} from "~/interfaces/internal/Notification"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { antiScamSiteNotification } from "./antiScamSiteNotification"
import { NotificationClient } from "./NotificationClient"

export const Notification = ({ type, site, ...props }: NotificationProps) => {
  if (type === "antiscam") {
    return (
      <NotificationClient title={antiScamSiteNotification.title}>
        <BaseParagraph
          content={getTextAsHtml({
            site,
            content: antiScamSiteNotification.content,
          })}
          className="prose-body-base"
        />
      </NotificationClient>
    )
  }

  const { title, content } = props as NotificationTitleContentConfig
  const body =
    content instanceof Array ? (
      <BaseParagraph
        content={getTextAsHtml({ site, content })}
        className="prose-body-base"
      />
    ) : (
      !!content &&
      hasContent(content.content) && <Prose {...content} site={site} />
    )
  return <NotificationClient title={title}>{body}</NotificationClient>
}
