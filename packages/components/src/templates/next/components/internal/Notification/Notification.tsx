import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { NotificationClient } from "./NotificationClient"

export const Notification = ({ content, title, site }: NotificationProps) => {
  const Paragraph = () =>
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

  return (
    <NotificationClient title={title}>
      <Paragraph />
    </NotificationClient>
  )
}
