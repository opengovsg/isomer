import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainerWrapper } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { DirectorySidebar } from "~/features/dashboard/components/DirectorySidebar"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const SiteEditorLayout: GetLayout = (page) => {
  const { siteId } = useQueryParse(siteSchema)

  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <CmsContainerWrapper
        siteId={siteId}
        sidenav={<DirectorySidebar siteId={siteId} />}
      >
        {page}
      </CmsContainerWrapper>
    </EnforceLoginStatePageWrapper>
  )
}
