import type { Meta, StoryObj } from "@storybook/react-vite"
import { http, HttpResponse } from "msw"
import { expect, userEvent, within } from "storybook/test"

import { PageFeedback } from "./PageFeedback"

const meta: Meta<typeof PageFeedback> = {
  title: "Next/Internal Components/PageFeedback",
  component: PageFeedback,
  argTypes: {},
  args: {
    layout: "content",
    apiEndpoint: "https://api.example.com/feedback",
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    msw: {
      handlers: [
        http.post("https://api.example.com/feedback", () => {
          return HttpResponse.json(
            { success: true },
            {
              status: 200,
            },
          )
        }),
      ],
    },
  },
}
export default meta
type Story = StoryObj<typeof PageFeedback>

export const Default: Story = {}

export const ThankYouState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const yesButton = canvas.getByRole("button", { name: /yes/i })
    await userEvent.click(yesButton)

    const thankYouText = await canvas.findByText("Thank you for your feedback!")
    await expect(thankYouText).toBeVisible()
  },
}
