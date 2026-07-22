import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { sitesHandlers } from "tests/msw/handlers/sites"
import RedirectsSettingsPage from "~/pages/sites/[siteId]/settings/redirects"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import {
  createAdvancedRedirectsEnabledGbParameters,
  createRedirectionsEnabledGbParameters,
} from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  ...ADMIN_HANDLERS,
  sitesHandlers.getNotification.default(),
  sitesHandlers.getTheme.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.readPageAndBlob.homepage(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
]

const COMMON_NEXTJS = {
  router: {
    asPath: "/sites/1/settings/redirects",
    query: {
      siteId: "1",
    },
  },
}

const meta: Meta<typeof RedirectsSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Redirects",
  component: RedirectsSettingsPage,
  parameters: {
    getLayout: RedirectsSettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: COMMON_NEXTJS,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const Empty: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.empty(),
        redirectHandlers.count.empty(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

// Fills the add-redirect form with a valid (schema-passing) pair and submits,
// so the server's response drives the inline error states below.
const submitNewRedirect = async (canvasElement: HTMLElement) => {
  const screen = within(canvasElement.ownerDocument.body)
  const sourceInput = await screen.findByPlaceholderText("redirect-from")
  await userEvent.type(sourceInput, "old-page")
  await userEvent.type(
    screen.getByPlaceholderText("/path-to-page or https://www.google.com"),
    "/new-page",
  )
  const addButton = screen.getByRole("button", { name: "Add" })
  await waitFor(() => expect(addButton).toBeEnabled())
  await userEvent.click(addButton, { pointerEventsCheck: 0 })
  return screen
}

// Creating over an existing live redirect shows the error inline on the source.
export const AlreadyExistsError: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.create.alreadyExists(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await submitNewRedirect(canvasElement)
    await expect(
      await screen.findByText("This page is already being redirected."),
    ).toBeVisible()
  },
}

// Opens the bulk-upload modal, uploads a valid CSV, and clicks "Process
// redirects" so the mocked validation drives the next screen.
const VALID_CSV =
  "When someone visits,Redirect them to\n/old-one,/new-one\n/old-two,https://www.example.gov.sg"

const openModalAndUpload = async (canvasElement: HTMLElement) => {
  const body = canvasElement.ownerDocument.body
  const screen = within(body)
  await userEvent.click(
    await screen.findByRole("button", { name: /bulk upload with a \.csv/i }),
  )
  // The dropzone's file input has no stable accessible label, so grab it
  // directly once the modal has mounted.
  const fileInput = await waitFor(() => {
    const input = body.querySelector<HTMLInputElement>("input[type='file']")
    if (!input) throw new Error("file input not found")
    return input
  })
  await userEvent.upload(
    fileInput,
    new File([VALID_CSV], "redirects.csv", { type: "text/csv" }),
  )
  const processButton = await screen.findByRole("button", {
    name: "Process redirects",
  })
  await waitFor(() => expect(processButton).toBeEnabled())
  await userEvent.click(processButton, { pointerEventsCheck: 0 })
  return screen
}

// Clicking the inline bulk-upload CTA opens the modal at its initial upload state.
export const BulkUploadModal: Story = {
  parameters: {
    growthbook: [
      createRedirectionsEnabledGbParameters(true),
      createAdvancedRedirectsEnabledGbParameters(true),
    ],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await screen.findByRole("button", { name: /bulk upload with a \.csv/i }),
    )
    // Finding the template download confirms the modal opened. Presence (not a
    // one-shot toBeVisible) is used deliberately: asserting visibility during
    // the modal's enter animation is flaky.
    await screen.findByText("Download redirects template (.csv)")
  },
}

// A fully valid file lands on the ready-to-publish screen.
export const BulkUploadReadyToPublish: Story = {
  parameters: {
    growthbook: [
      createRedirectionsEnabledGbParameters(true),
      createAdvancedRedirectsEnabledGbParameters(true),
    ],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.bulkValidate.allValid(),
        redirectHandlers.bulkCreate.success(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await openModalAndUpload(canvasElement)
    await expect(
      await screen.findByText("All 2 redirects are good to go."),
    ).toBeVisible()
    await expect(
      screen.getByRole("button", { name: "Publish 2 redirects" }),
    ).toBeVisible()
  },
}

// A file with a bad row lands on the errors screen with the download affordance.
export const BulkUploadWithErrors: Story = {
  parameters: {
    growthbook: [
      createRedirectionsEnabledGbParameters(true),
      createAdvancedRedirectsEnabledGbParameters(true),
    ],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.bulkValidate.withErrors(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await openModalAndUpload(canvasElement)
    await expect(await screen.findByText(/1 redirect has errors/)).toBeVisible()
    await expect(
      screen.getByRole("button", { name: "Download errors file (.csv)" }),
    ).toBeVisible()
  },
}

// A redirect that loops back shows the error inline on the destination.
export const RedirectLoopError: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.create.loop(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await submitNewRedirect(canvasElement)
    await expect(
      await screen.findByText(
        "This will trap visitors in a never-ending loop.",
      ),
    ).toBeVisible()
    // The loop error is inline only — the generic failure toast must not also
    // fire (regression guard for the error switch falling through to default).
    await expect(screen.queryByText("Failed to add redirect")).toBeNull()
  },
}
