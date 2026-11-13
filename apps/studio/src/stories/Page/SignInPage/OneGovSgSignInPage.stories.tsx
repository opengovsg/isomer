import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import { authOneGovSgHandlers } from "tests/msw/handlers/auth/oneGovSg"
import { meHandlers } from "tests/msw/handlers/me"
import SignInPage from "~/pages/sign-in"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { withArgosModes } from "@isomer/storybook-config"

const meta: Meta<typeof SignInPage> = {
  title: "Pages/Sign In Page/one.gov.sg Sign In Page",
  component: SignInPage,
  parameters: {
    loginState: false,
    argos: withArgosModes(["gsib", "mobile"]),
    growthbook: [createSingpassEnabledGbParameters(true)],
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.isEnabled(true),
        authOneGovSgHandlers.login.loading(),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof SignInPage>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByRole("button", { name: "Login with one.gov.sg" }),
    ).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.isEnabled(false),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByLabelText(/email/i)
    await expect(
      canvas.queryByRole("button", { name: "Login with one.gov.sg" }),
    ).not.toBeInTheDocument()
  },
}

export const LoggingIn: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Click Login with one.gov.sg", async () => {
      await userEvent.click(
        await canvas.findByRole("button", { name: "Login with one.gov.sg" }),
      )
    })

    await step("Show the hand-off step", async () => {
      await expect(
        await canvas.findByText("Logging in with one.gov.sg"),
      ).toBeInTheDocument()
    })
  },
}

export const AppLauncherLogin: Story = {
  parameters: {
    nextjs: {
      router: {
        query: { iss: "https://one.gov.sg/api/auth" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByText("Logging in with one.gov.sg"),
    ).toBeInTheDocument()
  },
}

export const LoginFailed: Story = {
  parameters: {
    nextjs: {
      router: {
        query: { oneGovSgError: "failed" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByText("We couldn’t log you in with one.gov.sg"),
    ).toBeInTheDocument()
  },
}

export const Unauthorized: Story = {
  parameters: {
    nextjs: {
      router: {
        query: { oneGovSgError: "unauthorized" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await canvas.findByText("You don’t have access to Isomer Studio"),
    ).toBeInTheDocument()
  },
}
