import { TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

import { UserTable } from "../UserTable"
import { InactiveUsersBanner, IsomerAdminAccessBanner } from "./Banners"
import { UserTableTab } from "./UserTableTab"

interface UserTableTabsProps {
  siteId: number
  agencyUsersCount: number
  isomerAdminsCount: number
  hasInactiveUsers: boolean
}

export const UserTableTabs = ({
  siteId,
  agencyUsersCount,
  isomerAdminsCount,
  hasInactiveUsers,
}: UserTableTabsProps) => {
  return (
    <Tabs w="100%">
      <TabList mb="1rem" borderBottomColor="base.divider.medium">
        <UserTableTab label="Your users" count={agencyUsersCount} />
        <UserTableTab label="Isomer admins" count={isomerAdminsCount} />
      </TabList>
      <TabPanels>
        <TabPanel>
          {hasInactiveUsers && <InactiveUsersBanner />}
          <UserTable siteId={siteId} getIsomerAdmins={false} />
        </TabPanel>
        <TabPanel>
          <IsomerAdminAccessBanner />
          <UserTable siteId={siteId} getIsomerAdmins={true} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
