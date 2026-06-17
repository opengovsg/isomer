import type { Meta, StoryObj } from "@storybook/nextjs"
import {
  createGazetteContent,
  createGazetteItem,
  gazetteHandlers,
} from "tests/msw/handlers/gazette"
import { pageHandlers } from "tests/msw/handlers/page"
import { userHandlers } from "tests/msw/handlers/user"
import { governmentGazetteSubcategories } from "~/features/gazettes/constants"
import GazettesPage from "~/pages/sites/[siteId]/gazettes"

import { ADMIN_HANDLERS } from "../handlers"
import { createEgazetteInfoGbParameters } from "../utils/growthbook"

// Must precede ADMIN_HANDLERS' isIsomerAdmin.default() (returns false), since
// MSW resolves to the first matching handler. The page redirects away unless
// the user is a Toppan user or an Isomer admin.
const baseHandlers = [
  userHandlers.isIsomerAdmin.admin(),
  ...ADMIN_HANDLERS,
  gazetteHandlers.collectionTags.default(),
  pageHandlers.countWithoutRoot.default(),
]

const meta: Meta<typeof GazettesPage> = {
  title: "Pages/eGazette/Gazettes Page",
  component: GazettesPage,
  parameters: {
    getLayout: GazettesPage.getLayout,
    growthbook: [
      createEgazetteInfoGbParameters({
        siteId: "1",
        gazettesCollectionId: "1",
      }),
    ],
    msw: {
      handlers: [...baseHandlers, gazetteHandlers.list.default()],
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const NotConfigured: Story = {
  parameters: {
    growthbook: [],
  },
}

// Empty notification number should show a dash, not look like an error.
export const EmptyNotificationNumber: Story = {
  parameters: {
    msw: {
      handlers: [
        ...baseHandlers,
        gazetteHandlers.list.withItems([
          createGazetteItem({
            id: "201",
            title: "Notice with no notification number assigned",
            content: createGazetteContent({
              ref: "/gazettes/26gg0001.pdf",
              category: "Government Gazette",
              description: "",
              tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
            }),
          }),
        ]),
      ],
    },
  },
}

// Long single-token file IDs must wrap inside the File ID column instead of
// spilling into Publish time. Pre-fix, the Link had no word-break and was
// wrapped in an HStack that grew past its cell.
export const OverflowingFileId: Story = {
  parameters: {
    msw: {
      handlers: [
        ...baseHandlers,
        gazetteHandlers.list.withItems([
          createGazetteItem({
            id: "202",
            title:
              "Government Gazette Extraordinary Supplement - Section 64 Notice",
            content: createGazetteContent({
              ref: "/gazettes/26gg-government-gazette-extraordinary-supplement-section-64-revised-statutes-2024-09-12.pdf",
              category: "Government Gazette",
              description: "2145",
              tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
            }),
          }),
        ]),
      ],
    },
  },
}

// When the file ID wraps onto multiple lines, the external-link icon should
// stay inline with the last fragment of text — not orphan onto its own line.
export const InlineExternalLinkIcon: Story = {
  parameters: {
    msw: {
      handlers: [
        ...baseHandlers,
        gazetteHandlers.list.withItems([
          createGazetteItem({
            id: "203",
            title: "Bills Supplement - Companies (Amendment) Bill 2024",
            content: createGazetteContent({
              ref: "/gazettes/26gg-bills-supplement-companies-amendment.pdf",
              category: "Legislation Supplements",
              description: "2199",
              tagged: ["Bills Supplement"],
            }),
          }),
        ]),
      ],
    },
  },
}
