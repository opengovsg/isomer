import type { ReactNode } from "react"
import type { NotificationProps } from "~/interfaces/internal/Notification"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { GOIS_SITE_NOTIFICATION } from "./goisSiteNotification"
import { NotificationClient } from "./NotificationClient"

export const Notification = (props: NotificationProps) => {
  const { type, LinkComponent, site } = props

  let title: string
  let body: ReactNode

  if (type === "gois") {
    title = GOIS_SITE_NOTIFICATION.title
    body = (
      <BaseParagraph
        content={getTextAsHtml({
          site,
          content: GOIS_SITE_NOTIFICATION.content,
        })}
        className="prose-body-base"
        LinkComponent={LinkComponent}
      />
    )
  } else {
    const { content } = props
    title = props.title
    body =
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
  }

  return <NotificationClient title={title}>{body}</NotificationClient>
}
