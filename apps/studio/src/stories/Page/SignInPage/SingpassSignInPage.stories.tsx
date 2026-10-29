import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { authSingpassHandlers } from "tests/msw/handlers/auth/singpass"
import { meHandlers } from "tests/msw/handlers/me"
import SingpassSignInPage from "~/pages/sign-in/singpass"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { withArgosModes } from "@isomer/storybook-config"

const meta: Meta<typeof SingpassSignInPage> = {
  title: "Pages/Sign In Page/Singpass Sign In Page",
  component: SingpassSignInPage,
  parameters: {
    argos: withArgosModes(["gsib", "mobile"]),
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

export const NewUserWithError: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.getUserProps.newUser(),
      ],
    },
    nextjs: {
      router: {
        query: {
          error: "true",
        },
      },
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

export const ExistingUserWithError: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authSingpassHandlers.getUserProps.existingUserWithName(),
      ],
    },
    nextjs: {
      router: {
        query: {
          error: "true",
        },
      },
    },
  },
}
