import type { NotificationProps } from "~/interfaces"
import { Prose } from "../../native"
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
      // Temporary solution for server-side rendering to optimize performance by
      // avoiding large sitemap transfers needed by BaseParagraph.
      // TODO: more robust refactor is required for BaseParagraph component
      baseParagraph={
        <Prose {...content} site={site} LinkComponent={LinkComponent} />
      }
    />
  )
}

export default Notification
