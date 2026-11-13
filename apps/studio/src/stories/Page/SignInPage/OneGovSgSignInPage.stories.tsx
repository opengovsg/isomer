import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { authEmailHandlers } from "tests/msw/handlers/auth/email"
import { authOneGovSgHandlers } from "tests/msw/handlers/auth/oneGovSg"
import { meHandlers } from "tests/msw/handlers/me"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import SignInPage from "~/pages/sign-in"
import {
  LOGIN_STATE_FLAG_TEST_ID,
  withLoginStateFlag,
} from "~/stories/decorators/withLoginStateFlag"
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
    await expect(
      canvas.getByText(/Ask your site’s admin to add you as a user/),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole("link", { name: "Isomer Support" }),
    ).toHaveAttribute("href", ISOMER_SUPPORT_LINK)
  },
}

export const DifferentEmailClearsOneGovSgError: Story = {
  parameters: {
    nextjs: {
      router: {
        query: { oneGovSgError: "failed" },
      },
    },
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.isEnabled(true),
        authEmailHandlers.login({
          email: "test@example.gov.sg",
          otpPrefix: "TST",
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Request an OTP after a failed one.gov.sg login", async () => {
      await canvas.findByText("We couldn’t log you in with one.gov.sg")
      await userEvent.type(
        await canvas.findByLabelText(/email/i),
        "test@example.gov.sg",
      )
      await userEvent.click(await canvas.findByText(/send/i))
      await canvas.findByText(/sent an OTP to/i)
    })

    await step("Go back to use a different email", async () => {
      await userEvent.click(await canvas.findByText(/use a different email/i))
      await canvas.findByLabelText(/email/i)
      await expect(
        canvas.queryByText("We couldn’t log you in with one.gov.sg"),
      ).not.toBeInTheDocument()
    })
  },
}

export const LauncherFailureClearsStaleLoginFlag: Story = {
  decorators: [withLoginStateFlag],
  parameters: {
    loginState: true,
    nextjs: {
      router: {
        query: { iss: "https://one.gov.sg/api/auth" },
      },
    },
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authOneGovSgHandlers.isEnabled(true),
        authOneGovSgHandlers.login.error(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() =>
      expect(canvas.getByTestId(LOGIN_STATE_FLAG_TEST_ID)).toHaveTextContent(
        "false",
      ),
    )
  },
}
