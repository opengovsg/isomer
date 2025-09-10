import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainerWrapper } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const SiteBasicLayout: GetLayout = (page) => {
  const { siteId } = useQueryParse(siteSchema)

  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <CmsContainerWrapper siteId={siteId}>{page}</CmsContainerWrapper>
    </EnforceLoginStatePageWrapper>
  )
}
