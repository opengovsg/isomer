import type { CentralNotificationProps } from "~/interfaces"
import { CentralNotificationClient } from "./CentralNotificationClient"

export const CentralNotification = ({
  site,
  LinkComponent,
}: CentralNotificationProps) => {
  if (!site.assetsBaseUrl) return null

  return (
    <CentralNotificationClient
      assetsBaseUrl={site.assetsBaseUrl}
      siteUrl={site.url}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}
