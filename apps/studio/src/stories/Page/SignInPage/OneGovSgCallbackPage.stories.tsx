import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, waitFor, within } from "storybook/test"
import { authOneGovSgHandlers } from "tests/msw/handlers/auth/oneGovSg"
import { meHandlers } from "tests/msw/handlers/me"
import OneGovSgCallbackPage from "~/pages/sign-in/onegov/callback"
import {
  LOGIN_STATE_FLAG_TEST_ID,
  withLoginStateFlag,
} from "~/stories/decorators/withLoginStateFlag"

const meta: Meta<typeof OneGovSgCallbackPage> = {
  title: "Pages/Sign In Page/one.gov.sg Callback Page",
  component: OneGovSgCallbackPage,
  decorators: [withLoginStateFlag],
  parameters: {
    // A stale flag from an expired session must not survive the callback.
    loginState: true,
    nextjs: {
      router: {
        query: {
          state: "state",
          iss: "https://one.gov.sg/api/auth",
          code: "code",
        },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof OneGovSgCallbackPage>

const expectLoginStateFlagCleared = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await waitFor(() =>
    expect(canvas.getByTestId(LOGIN_STATE_FLAG_TEST_ID)).toHaveTextContent(
      "false",
    ),
  )
}

export const ContinuesToSingpass: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.callback.continueToSingpass(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expectLoginStateFlagCleared(canvasElement)
  },
}

export const Failed: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.callback.error(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expectLoginStateFlagCleared(canvasElement)
  },
}
