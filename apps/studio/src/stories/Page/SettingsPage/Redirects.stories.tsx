import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { sitesHandlers } from "tests/msw/handlers/sites"
import RedirectsSettingsPage from "~/pages/sites/[siteId]/settings/redirects"
import { MAX_BULK_REDIRECT_CSV_BYTES } from "~/schemas/redirect"
import { ADMIN_HANDLERS } from "~/stories/handlers"

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
  const sourceInput = await screen.findByPlaceholderText(
    "redirect-from or path/*",
  )
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

// Distinct contents, so swapping it in genuinely changes what would be published.
const SWAPPED_CSV =
  "When someone visits,Redirect them to\n/other-old,/other-new"

// Processing holds its spinner for a deliberate minimum duration, so anything
// asserted after "Process redirects" needs longer than the 1s default.
const AFTER_PROCESSING = { timeout: 10000 }

const openBulkUploadModal = async (canvasElement: HTMLElement) => {
  const body = canvasElement.ownerDocument.body
  const screen = within(body)
  await userEvent.click(
    await screen.findByRole("button", { name: /bulk upload with a \.csv/i }),
  )
  return { body, screen }
}

// The dropzone's file input has no stable accessible label, so grab it directly.
// Scope to the modal dialog so an unrelated file input elsewhere on the page
// can't be picked up by mistake, and re-query per pick: the dropzone unmounts
// while a file is attached, so each pick sees a freshly mounted input.
const pickFileInModal = async (body: HTMLElement, file: File) => {
  const fileInput = await waitFor(() => {
    const input = body.querySelector<HTMLInputElement>(
      "[role='dialog'] input[type='file']",
    )
    if (!input) throw new Error("file input not found")
    return input
  })
  await userEvent.upload(fileInput, file)
}

const openModalAndUpload = async (canvasElement: HTMLElement) => {
  const { body, screen } = await openBulkUploadModal(canvasElement)
  await pickFileInModal(
    body,
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
    // The mocked validation resolves near-instantly; the minimum spinner
    // duration is what keeps the result off screen for a beat, so the
    // transition is noticeable rather than a flicker.
    await expect(
      screen.queryByText("All 2 redirects are good to go."),
    ).toBeNull()
    await expect(
      await screen.findByText(
        "All 2 redirects are good to go.",
        {},
        AFTER_PROCESSING,
      ),
    ).toBeVisible()
    await expect(
      screen.getByRole("button", { name: "Publish 2 redirects" }),
    ).toBeVisible()
  },
}

// Regression: the chip's remove button stays live while processing, so the file
// can be swapped mid-process. The first run's verdicts must not open the review
// screen for a file that is no longer attached — otherwise the editor reviews one
// batch and publishes another.
//
// Validation is held open so the swap lands before the response rather than
// racing the client's own minimum duration, which would make this flaky on a
// slow machine.
export const BulkUploadFileSwappedWhileProcessing: Story = {
  parameters: {
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.bulkValidate.allValid({ wait: 3000 }),
        redirectHandlers.bulkCreate.success(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const { body, screen } = await openBulkUploadModal(canvasElement)
    await pickFileInModal(
      body,
      new File([VALID_CSV], "first.csv", { type: "text/csv" }),
    )
    const processButton = await screen.findByRole("button", {
      name: "Process redirects",
    })
    await waitFor(() => expect(processButton).toBeEnabled())
    await userEvent.click(processButton, { pointerEventsCheck: 0 })

    // Still inside the floor: drop the file being processed and attach another.
    await userEvent.click(screen.getByRole("button", { name: "Remove file" }), {
      pointerEventsCheck: 0,
    })
    await pickFileInModal(
      body,
      new File([SWAPPED_CSV], "second.csv", { type: "text/csv" }),
    )

    // Once the floor elapses the spinner clears, and the stale verdicts are
    // dropped: the modal stays on the upload step with the newly attached file
    // instead of showing the first file's review screen.
    await waitFor(
      () =>
        expect(
          screen.getByRole("button", { name: "Process redirects" }),
        ).toBeEnabled(),
      AFTER_PROCESSING,
    )
    await expect(screen.queryByText(/good to go/)).toBeNull()
    await expect(screen.queryByRole("button", { name: /^Publish/ })).toBeNull()
    await expect(screen.getByText("second.csv")).toBeVisible()
  },
}

// A file with a bad row lands on the errors screen with the download affordance.
export const BulkUploadWithErrors: Story = {
  parameters: {
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
    await expect(
      await screen.findByText(/1 redirect has errors/, {}, AFTER_PROCESSING),
    ).toBeVisible()
    await expect(
      screen.getByRole("button", { name: "Download errors file (.csv)" }),
    ).toBeVisible()
  },
}

// A file the dropzone rejects outright reads the same as one that fails the
// content checks: attached chip, reason inline under the size/type hints.
const OVERSIZE_MESSAGE =
  "This file is too big. Upload a file under 1 MB and try again."

export const BulkUploadOversizeFile: Story = {
  parameters: {
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const { body, screen } = await openBulkUploadModal(canvasElement)
    const tooBig = new File(
      ["a".repeat(MAX_BULK_REDIRECT_CSV_BYTES + 1)],
      "too-big.csv",
      { type: "text/csv" },
    )
    await pickFileInModal(body, tooBig)

    await expect(await screen.findByText(OVERSIZE_MESSAGE)).toBeVisible()
    // Shown as the attached chip: the dropzone is replaced, and the design
    // system's own dismissable error chip must not appear alongside it.
    await expect(
      screen.getByRole("button", { name: "Remove file" }),
    ).toBeVisible()
    await expect(
      screen.queryByRole("button", { name: "Dismiss error" }),
    ).toBeNull()
    await expect(
      body.querySelector("[role='dialog'] input[type='file']"),
    ).toBeNull()

    // Removing clears the message — the guard that keeps a rejection on screen
    // through the dropzone's trailing reset must not swallow a real removal.
    await userEvent.click(screen.getByRole("button", { name: "Remove file" }), {
      pointerEventsCheck: 0,
    })
    await waitFor(() => expect(screen.queryByText(OVERSIZE_MESSAGE)).toBeNull())

    // Re-picking lands back on the same state, which is what this story shows.
    await pickFileInModal(body, tooBig)
    await expect(await screen.findByText(OVERSIZE_MESSAGE)).toBeVisible()
  },
}

// Wildcard source typed — shows the live preview help text.
export const AdvancedWildcardPreview: Story = {
  parameters: {
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
    const sourceInput = await screen.findByPlaceholderText(
      "redirect-from or path/*",
    )
    await userEvent.type(sourceInput, "old-news/*")
    await userEvent.type(
      screen.getByPlaceholderText("/path-to-page or https://www.google.com"),
      "/newsroom",
    )
    await expect(
      await screen.findByText(/old-news\/example → \/newsroom\/example/),
    ).toBeVisible()
  },
}

// A destination pasted with surrounding whitespace still previews the
// trimmed value the schema submits, not the raw padded input.
export const AdvancedWildcardPreviewTrimsDestination: Story = {
  parameters: {
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
    const sourceInput = await screen.findByPlaceholderText(
      "redirect-from or path/*",
    )
    await userEvent.type(sourceInput, "old-news/*")
    await userEvent.type(
      screen.getByPlaceholderText("/path-to-page or https://www.google.com"),
      "  /newsroom  ",
    )
    await expect(
      await screen.findByText(/old-news\/example → \/newsroom\/example/),
    ).toBeVisible()
  },
}

// A redirect that loops back shows the error inline on the destination.
export const RedirectLoopError: Story = {
  parameters: {
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
