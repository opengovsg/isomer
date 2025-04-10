import type { Meta, StoryObj } from "@storybook/react"
import { authSingpassHandlers } from "tests/msw/handlers/auth/singpass"
import { meHandlers } from "tests/msw/handlers/me"

import { withChromaticModes } from "@isomer/storybook-config"

import SingpassSignInPage from "~/pages/sign-in/singpass"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

const meta: Meta<typeof SingpassSignInPage> = {
  title: "Pages/Sign In Page/Singpass Sign In Page",
  component: SingpassSignInPage,
  parameters: {
    chromatic: withChromaticModes(["gsib", "mobile"]),
    loginState: false,
    growthbook: [createSingpassEnabledGbParameters(true)],
  },
}

export default meta
type Story = StoryObj<typeof SingpassSignInPage>

export const NewUser: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.getUserProps.newUser(),
      ],
    },
  },
}

export const ExistingUser: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.getUserProps.existingUser(),
      ],
    },
  },
}

export const ExistingUserWithName: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.getUserProps.existingUserWithName(),
      ],
    },
  },
}
