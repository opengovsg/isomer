import type { UseDisclosureReturn } from "@chakra-ui/react"

import { CmsCollapsibleSidenav } from "~/components/CmsSidebar/CmsCollapsibleSidenav"

interface SettingsSidenavProps {
  onSidenavClose: UseDisclosureReturn["onClose"]
}

export const SettingsSidenav = ({ onSidenavClose }: SettingsSidenavProps) => {
  return (
    <CmsCollapsibleSidenav
      title="Site settings"
      onSidenavClose={onSidenavClose}
    >
      <p>Content in sidenav</p>
    </CmsCollapsibleSidenav>
  )
}
