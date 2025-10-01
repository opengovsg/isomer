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
        className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0"
        site={site}
        LinkComponent={LinkComponent}
      />
    ) : (
      !!content &&
      hasContent(content.content) && (
        <Prose {...content} site={site} LinkComponent={LinkComponent} />
      )
    )

  return (
    <NotificationClient
      title={title}
      // Temporary solution for server-side rendering to optimize performance by
      // avoiding large sitemap transfers needed by BaseParagraph.
      // TODO: more robust refactor is required for BaseParagraph component
      baseParagraph={!!content && <Paragraph />}
    />
  )
}

export default Notification
