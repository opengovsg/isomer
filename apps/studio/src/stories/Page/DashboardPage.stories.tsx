import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { sitesHandlers } from "tests/msw/handlers/sites"
import {
  ExpiredSiteAccessModal,
  type ExpiredSite,
} from "~/features/dashboard/ExpiredSiteAccess/ExpiredSiteAccessModal"
import DashboardPage from "~/pages/index"
import { ADMIN_HANDLERS } from "~/stories/handlers"

import { createBannerGbParameters } from "../utils/growthbook"

const SITE_WITH_ADMINS: ExpiredSite = {
  id: 101,
  config: {
    theme: "isomer-next",
    siteName: "ACME Gov",
    url: "https://www.mti.gov.sg",
    logoUrl: "",
    search: undefined,
    isGovernment: true,
  } as PrismaJson.SiteJsonConfig,
  adminEmails: ["alpha.admin@mti.gov.sg", "zebra.admin@mti.gov.sg"],
}

const SITE_WITHOUT_ADMINS: ExpiredSite = {
  id: 102,
  config: {
    theme: "isomer-next",
    siteName: "Agency with no site admins",
    url: "https://www.example.gov.sg",
    logoUrl: "",
    search: undefined,
    isGovernment: true,
  } as PrismaJson.SiteJsonConfig,
  adminEmails: [],
}

const meta: Meta<typeof DashboardPage> = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  parameters: {
    getLayout: DashboardPage.getLayout,
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        sitesHandlers.list.default(),
        sitesHandlers.listExpired.empty(),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof DashboardPage>

export const Dashboard: Story = {}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        sitesHandlers.list.loading(),
        sitesHandlers.listExpired.empty(),
      ],
    },
  },
}

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        sitesHandlers.list.empty(),
        sitesHandlers.listExpired.empty(),
      ],
    },
  },
}

export const WithExpiredSites: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        sitesHandlers.list.default(),
        sitesHandlers.listExpired.default(),
      ],
    },
  },
}

export const WithBanner: Story = {
  parameters: {
    growthbook: [
      createBannerGbParameters({
        variant: "error",
        message: "This is a test banner",
      }),
    ],
  },
}

export const RequestAccessModalWithSiteAdmins: Story = {
  parameters: {
    chromatic: { delay: 200 },
    msw: {
      handlers: ADMIN_HANDLERS,
    },
  },
  render: () => (
    <Box w="100%" h="100vh">
      <ExpiredSiteAccessModal
        site={SITE_WITH_ADMINS}
        loginEmail="johndoe@corp.gov.sg"
        onClose={() => undefined}
      />
    </Box>
  ),
}

export const RequestAccessModalNoSiteAdmins: Story = {
  parameters: {
    chromatic: { delay: 200 },
    msw: {
      handlers: ADMIN_HANDLERS,
    },
  },
  render: () => (
    <Box w="100%" h="100vh">
      <ExpiredSiteAccessModal
        site={SITE_WITHOUT_ADMINS}
        loginEmail="johndoe@corp.gov.sg"
        onClose={() => undefined}
      />
    </Box>
  ),
}
