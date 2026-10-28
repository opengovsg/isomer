import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { authSingpassHandlers } from "tests/msw/handlers/auth/singpass"
import { meHandlers } from "tests/msw/handlers/me"
import SingpassCallbackPage from "~/pages/sign-in/singpass/callback"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { withArgosModes } from "@isomer/storybook-config"

const meta: Meta<typeof SingpassCallbackPage> = {
  title: "Pages/Sign In Page/Singpass Callback Page",
  component: SingpassCallbackPage,
  parameters: {
    loginState: false,
    argos: withArgosModes(["gsib", "mobile"]),
    growthbook: [createSingpassEnabledGbParameters(true)],
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.callback.default(),
      ],
    },
    nextjs: {
      router: {
        query: {
          state: "state",
          code: "code",
        },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SingpassCallbackPage>

export const NewUser: Story = {}
