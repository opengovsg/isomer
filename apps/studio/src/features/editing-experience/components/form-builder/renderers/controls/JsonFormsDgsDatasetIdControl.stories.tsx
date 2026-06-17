import type { Meta, StoryObj } from "@storybook/nextjs"
import { http, HttpResponse } from "msw"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { DgsDatasetIdModal } from "./JsonFormsDgsDatasetIdControl"

const DGS_RESOURCE_ID = "d_3c55210de27fcccda2ed0c63fdd2b352"
const DGS_METADATA_URL = `https://api-production.data.gov.sg/v2/public/api/datasets/${DGS_RESOURCE_ID}/metadata`
const DGS_DATASET_URL = `https://data.gov.sg/datasets/${DGS_RESOURCE_ID}/view`

const meta: Meta<typeof DgsDatasetIdModal> = {
  title: "Components/Form Builder/DgsDatasetIdModal",
  component: DgsDatasetIdModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
    onSave: () => undefined,
  },
}

export default meta

type Story = StoryObj<typeof meta>

const typeDatasetUrl = async (canvasElement: HTMLElement) => {
  const screen = within(canvasElement.ownerDocument.body)
  const input = await screen.findByPlaceholderText("Paste dataset URL here")
  await userEvent.clear(input)
  await userEvent.type(input, DGS_DATASET_URL)
}

export const OverDatasetSizeCap: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DGS_METADATA_URL, () => {
          return HttpResponse.json({
            data: {
              name: "Over-cap dataset",
              format: "CSV",
              datasetSize: 25 * 1024 * 1024, // 25MB — exceeds DGS_MAX_DATASET_BYTES (20MB)
              columnMetadata: { metaMapping: {} },
            },
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await typeDatasetUrl(canvasElement)

    const rootScreen = within(canvasElement.ownerDocument.body)
    await waitFor(
      async () => {
        await expect(
          rootScreen.getByText(
            /This dataset is .+\. Datasets must be .+ or smaller to be linked here\./,
          ),
        ).toBeInTheDocument()
        await expect(
          rootScreen.getByRole("button", { name: /Save Dataset ID/i }),
        ).toBeDisabled()
      },
      { timeout: 5000 },
    )
  },
}

export const NonCsvFormat: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DGS_METADATA_URL, () => {
          return HttpResponse.json({
            data: {
              name: "JSON dataset",
              format: "JSON",
              datasetSize: 100 * 1024,
              columnMetadata: { metaMapping: {} },
            },
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await typeDatasetUrl(canvasElement)

    const rootScreen = within(canvasElement.ownerDocument.body)
    await waitFor(
      () =>
        expect(
          rootScreen.getByText(
            /You can only link CSV datasets\. Please check the dataset ID and try again\./,
          ),
        ).toBeInTheDocument(),
      { timeout: 5000 },
    )
  },
}

export const ValidCsvUnderCap: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DGS_METADATA_URL, () => {
          return HttpResponse.json({
            data: {
              name: "Valid dataset",
              format: "CSV",
              datasetSize: 200 * 1024, // 200KB
              columnMetadata: { metaMapping: {} },
            },
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await typeDatasetUrl(canvasElement)

    const rootScreen = within(canvasElement.ownerDocument.body)
    await waitFor(
      async () => {
        await expect(
          rootScreen.getByText("✓ Valid CSV dataset"),
        ).toBeInTheDocument()
        await expect(
          rootScreen.getByRole("button", { name: /Save Dataset ID/i }),
        ).toBeEnabled()
      },
      { timeout: 5000 },
    )
  },
}
