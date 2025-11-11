import { useDisclosure } from "@chakra-ui/react"

import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainerWrapper } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { siteSchema } from "~/features/editing-experience/schema"
import { SettingsSidenav } from "~/features/settings/SettingsSidenav"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const SiteSettingsLayout: GetLayout = (page) => {
  const { siteId } = useQueryParse(siteSchema)
  const {
    isOpen: isSidenavOpen,
    onOpen: onSidenavOpen,
    onClose: onSidenavClose,
  } = useDisclosure({ defaultIsOpen: true })

  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <CmsContainerWrapper
        variant="gsib"
        siteId={siteId}
        sidenav={
          isSidenavOpen ? (
            <SettingsSidenav onSidenavClose={onSidenavClose} />
          ) : undefined
        }
        onSidenavOpen={onSidenavOpen}
      >
        {page}
      </CmsContainerWrapper>
    </EnforceLoginStatePageWrapper>
  )
}
