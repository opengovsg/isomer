import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"

import {
  WOGAA_SENTIMENT_SHOWN_SESSION_KEY,
  WogaaSentimentTriggerClient,
} from "./WogaaSentimentTriggerClient"

const POPUP_SHOWN_TEXT = "Mock WOGAA Sentiments pop-up shown"

// Stand-in for wogaa.js: renders a marker instead of WOGAA's real pop-up
const mockWogaa = () => {
  window.wogaaCustom = {
    sentiments: {
      showRatingPopup: () => {
        const marker = document.createElement("p")
        marker.textContent = POPUP_SHOWN_TEXT
        marker.setAttribute("data-testid", "mock-wogaa-popup")
        document.body.appendChild(marker)
      },
    },
  }
}

const removeMockPopups = () => {
  document
    .querySelectorAll("[data-testid='mock-wogaa-popup']")
    .forEach((node) => node.remove())
}

const meta: Meta<typeof WogaaSentimentTriggerClient> = {
  title: "Next/Internal Components/WogaaSentimentTrigger",
  component: WogaaSentimentTriggerClient,
  beforeEach: () => {
    sessionStorage.removeItem(WOGAA_SENTIMENT_SHOWN_SESSION_KEY)
    removeMockPopups()
    mockWogaa()

    return () => {
      delete window.wogaaCustom
      removeMockPopups()
    }
  },
  args: {
    // Shortened from the real 60s so the story is quick to check
    delayMs: 1000,
    scrollDepthThreshold: 0.75,
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  render: (args) => (
    <>
      <WogaaSentimentTriggerClient {...args} />
      <p className="prose-body-base p-4">
        The mock pop-up appears after {args.delayMs / 1000}s, or once you scroll
        past {args.scrollDepthThreshold * 100}% of the page, whichever is first.
      </p>
      <div style={{ height: "300vh" }} />
    </>
  ),
}
export default meta
type Story = StoryObj<typeof meta>

export const TimerTrigger: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await waitFor(
      () => expect(body.getByText(POPUP_SHOWN_TEXT)).toBeInTheDocument(),
      { timeout: 3000 },
    )
  },
}

export const ScrollTrigger: Story = {
  args: {
    // Long enough that only scrolling can trigger it within the test
    delayMs: 60_000,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const { documentElement } = canvasElement.ownerDocument
    documentElement.scrollTop = documentElement.scrollHeight
    canvasElement.ownerDocument.defaultView?.dispatchEvent(new Event("scroll"))

    await waitFor(
      () => expect(body.getByText(POPUP_SHOWN_TEXT)).toBeInTheDocument(),
      { timeout: 3000 },
    )
  },
}

export const AlreadyShownThisSession: Story = {
  beforeEach: () => {
    sessionStorage.setItem(WOGAA_SENTIMENT_SHOWN_SESSION_KEY, "true")
  },
  args: {
    delayMs: 200,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await expect(body.queryByText(POPUP_SHOWN_TEXT)).not.toBeInTheDocument()
  },
}
