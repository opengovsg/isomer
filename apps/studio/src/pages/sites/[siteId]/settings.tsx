import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"

const SiteSettingsPage: NextPageWithLayout = () => {
  return <div>Settings page</div>
}

SiteSettingsPage.getLayout = AdminCmsSidebarLayout
export default SiteSettingsPage
