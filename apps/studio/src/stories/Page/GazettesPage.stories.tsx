import type { Meta, StoryObj } from "@storybook/nextjs"
import { delay, http, HttpResponse } from "msw"
import { expect, userEvent, within } from "storybook/test"
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

// Stands in for the S3 PUT during the create flow's file upload step.
const uploadHandler = http.put("/storybook/upload", async () => {
  await delay()
  return HttpResponse.json()
})

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
              category: "Legislative Supplements",
              description: "2199",
              tagged: ["Bills Supplement"],
            }),
          }),
        ]),
      ],
    },
  },
}

// The collection already contains a Government Gazette with notification number
// "2145" (visible in the table). Submitting the create form with that same
// number surfaces the backend's CONFLICT error as an error toast, rather than
// silently creating a duplicate.
const DUPLICATE_NOTIFICATION_NUMBER = "2145"

export const DuplicateNotificationNumber: Story = {
  parameters: {
    msw: {
      handlers: [
        ...baseHandlers,
        // The existing gazette the new one would duplicate — its notification
        // number shows in the table as the visual context for this scenario.
        gazetteHandlers.list.default(),
        gazetteHandlers.getPresignedPutUrl.default(),
        gazetteHandlers.create.duplicateNotificationNumber(),
        uploadHandler,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // The modal renders in a portal, so query the whole document body.
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(
      await screen.findByRole("button", { name: /Add a new Gazette/i }),
    )

    await userEvent.type(
      await screen.findByPlaceholderText("Enter a title"),
      "Duplicate notice",
    )

    // Category defaults to "Government Gazette"; the form renders the Category
    // and Subcategory SingleSelects in that order, so the second combobox is
    // the subcategory. Pick "Tenders" — a label that doesn't appear in the
    // seeded table row, so matching the option by its visible text stays
    // unambiguous. Government Gazette duplicates are detected by category and
    // year regardless of subcategory, so this is still a duplicate.
    const subcategoryCombobox = (await screen.findAllByRole("combobox"))[1]
    if (!subcategoryCombobox) {
      throw new Error("Expected a subcategory combobox to be rendered")
    }
    await userEvent.click(subcategoryCombobox)
    const virtuoso = await screen.findByTestId("virtuoso-item-list")
    await userEvent.click(
      await within(virtuoso).findByText(
        governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS,
      ),
    )

    await userEvent.type(
      await screen.findByPlaceholderText("Enter Notification Number"),
      DUPLICATE_NOTIFICATION_NUMBER,
    )

    // Uploading the PDF auto-fills the File ID and enables the submit button.
    await userEvent.upload(
      await screen.findByTestId("file-upload"),
      new File(["dummy"], "26gg9999.pdf", { type: "application/pdf" }),
    )

    await userEvent.click(
      await screen.findByRole("button", { name: /Add Gazette/i }),
    )

    // The CONFLICT message is surfaced in the error toast's description.
    // Submit awaits the upload + create round-trips before the toast renders,
    // so allow more than the default 1s for the message to appear.
    await expect(
      await screen.findByText(
        "A gazette with the same notification number already exists",
        undefined,
        // NOTE: Change to 500 ms cos we don't want the chromatic step to take so long
        { timeout: 500 },
      ),
    ).toBeInTheDocument()
  },
}
