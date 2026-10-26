import type { HardBreakProps, NotificationProps, TextProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { NotificationClient } from "./NotificationClient"

export const Notification = ({ site, ...notification }: NotificationProps) => {
  if (notification.type === "antiscam") {
    return (
      <NotificationClient title="Government officials will never ask you to transfer money over a phone call.">
        <BaseParagraph
          content={getTextAsHtml({
            site,
            content: [
              {
                type: "text",
                text: "If you're unsure if something is a scam, call ",
              },
              {
                type: "text",
                text: "ScamShield",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "https://www.scamshield.gov.sg",
                      target: "_blank",
                    },
                  },
                ],
              },
              {
                type: "text",
                text: " at 1799.",
              },
            ] satisfies (HardBreakProps | TextProps)[],
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
