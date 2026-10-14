import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import {
  ANTI_SCAM_DISCLAIMER_AFTER,
  ANTI_SCAM_DISCLAIMER_BEFORE,
  ANTI_SCAM_DISCLAIMER_LINK_HREF,
  ANTI_SCAM_DISCLAIMER_LINK_LABEL,
  ANTI_SCAM_DISCLAIMER_TITLE,
} from "../../antiScamDisclaimerCopy"
import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { NotificationClient } from "./NotificationClient"

const antiScamContent = [
  {
    type: "text" as const,
    text: ANTI_SCAM_DISCLAIMER_BEFORE,
  },
  {
    type: "text" as const,
    text: ANTI_SCAM_DISCLAIMER_LINK_LABEL,
    marks: [
      {
        type: "link" as const,
        attrs: {
          href: ANTI_SCAM_DISCLAIMER_LINK_HREF,
          target: "_blank" as const,
        },
      },
    ],
  },
  {
    type: "text" as const,
    text: ANTI_SCAM_DISCLAIMER_AFTER,
  },
]

export const Notification = ({ site, ...notification }: NotificationProps) => {
  if (notification.type === "antiscam") {
    return (
      <NotificationClient title={ANTI_SCAM_DISCLAIMER_TITLE}>
        <BaseParagraph
          content={getTextAsHtml({
            site,
            content: antiScamContent,
          })}
          className="prose-body-base"
        />
      </NotificationClient>
    )
  }

  const { title, content } = notification
  const body =
    content instanceof Array ? (
      <BaseParagraph
        content={getTextAsHtml({ site, content })}
        className="prose-body-base"
      />
    ) : (
      !!content &&
      hasContent(content.content) && (
        // Notification is site-wide chrome rendered outside the main content
        // flow (see Skeleton), so it isn't wired into the page's computed
        // heading levels — it keeps a fixed level of its own.
        <Prose {...content} site={site} headingLevel={3} />
      )
    )
  return <NotificationClient title={title}>{body}</NotificationClient>
}
