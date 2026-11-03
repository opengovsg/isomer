import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Box } from "@chakra-ui/react"
import { expect, userEvent, within } from "storybook/test"

import { FreshFromIsomerPanel } from "./FreshFromIsomerPanel"

const meta: Meta<typeof FreshFromIsomerPanel> = {
  title: "Components/FreshFromIsomerPanel",
  component: FreshFromIsomerPanel,
  decorators: [
    (Story) => (
      <Box p="2rem">
        <Story />
      </Box>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Every tab must point at a tabpanel that exists in the DOM, even while that
// tab is inactive, so assistive tech keeps the tab-to-panel relationship.
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Shows the current edition's spotlights", async () => {
      await expect(canvas.getByText("Nov 2026 edition")).toBeVisible()
      const tabs = await canvas.findAllByRole("tab")
      await expect(tabs.map((tab) => tab.textContent)).toEqual([
        "Hero banners",
        "Table editing",
        "Page history",
      ])
      await expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    })

    await step("Each tab controls a mounted tabpanel", async () => {
      for (const tab of canvas.getAllByRole("tab")) {
        const panelId = tab.getAttribute("aria-controls")
        await expect(panelId).toBeTruthy()
        const panel = canvasElement.querySelector(`#${panelId}`)
        await expect(panel).toHaveAttribute("role", "tabpanel")
        await expect(panel).toHaveAttribute("aria-labelledby", tab.id)
      }
    })
  },
}

export const SwitchTab: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Click the Table editing tab", async () => {
      await userEvent.click(
        await canvas.findByRole("tab", { name: "Table editing" }),
      )
    })

    await step("Shows the Table editing announcement", async () => {
      await expect(
        canvas.getByRole("tab", { name: "Table editing" }),
      ).toHaveAttribute("aria-selected", "true")
      await expect(
        canvas.getByRole("tab", { name: "Hero banners" }),
      ).toHaveAttribute("aria-selected", "false")
      await expect(
        canvas.getByRole("heading", {
          name: "Tables just got easier to work with",
        }),
      ).toBeVisible()
      await expect(
        canvas.getByRole("link", { name: /learn more/i }),
      ).toHaveAttribute(
        "href",
        "https://support.isomer.gov.sg/en/articles/10425930-text-block#h_6da533f62d",
      )
    })
  },
}

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const tab = (name: string) => canvas.getByRole("tab", { name })

    await step("Only the active tab is in the tab order", async () => {
      await expect(
        await canvas.findByRole("tab", { name: "Hero banners" }),
      ).toHaveAttribute("tabindex", "0")
      await expect(tab("Table editing")).toHaveAttribute("tabindex", "-1")
      await expect(tab("Page history")).toHaveAttribute("tabindex", "-1")
    })

    await step("Arrow keys move selection and focus", async () => {
      tab("Hero banners").focus()
      await userEvent.keyboard("{ArrowRight}")
      await expect(tab("Table editing")).toHaveAttribute(
        "aria-selected",
        "true",
      )
      await expect(tab("Table editing")).toHaveFocus()

      await userEvent.keyboard("{ArrowLeft}")
      await expect(tab("Hero banners")).toHaveAttribute("aria-selected", "true")
      await expect(tab("Hero banners")).toHaveFocus()
    })

    await step("Home and End jump to the ends, arrows wrap", async () => {
      await userEvent.keyboard("{End}")
      await expect(tab("Page history")).toHaveAttribute("aria-selected", "true")
      await expect(tab("Page history")).toHaveFocus()

      await userEvent.keyboard("{ArrowRight}")
      await expect(tab("Hero banners")).toHaveAttribute("aria-selected", "true")

      await userEvent.keyboard("{Home}")
      await expect(tab("Hero banners")).toHaveFocus()
    })
  },
}
