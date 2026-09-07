import type { Meta, StoryObj } from "@storybook/nextjs"
import { authSingpassHandlers } from "tests/msw/handlers/auth/singpass"
import { meHandlers } from "tests/msw/handlers/me"
import SingpassCallbackPage from "~/pages/sign-in/singpass/callback"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { withChromaticModes } from "@isomer/storybook-config"

const meta: Meta<typeof SingpassCallbackPage> = {
  component: SingpassCallbackPage,
  parameters: {
    chromatic: withChromaticModes(["gsib", "mobile"]),
    growthbook: [createSingpassEnabledGbParameters(true)],
    loginState: false,
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.callback.default(),
      ],
    },
    nextjs: {
      router: {
        query: {
          code: "code",
          state: "state",
        },
      },
    },
  },
  title: "Pages/Sign In Page/Singpass Callback Page",
}

export default meta
type Story = StoryObj<typeof SingpassCallbackPage>

export const NewUser: Story = {}
