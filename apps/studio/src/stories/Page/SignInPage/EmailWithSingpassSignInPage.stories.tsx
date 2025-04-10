import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { authEmailHandlers } from "tests/msw/handlers/auth/email"
import { meHandlers } from "tests/msw/handlers/me"

import { withChromaticModes } from "@isomer/storybook-config"

import SignInPage from "~/pages/sign-in"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

const VALID_AUTH_EMAIL = "test@example.gov.sg"

const meta: Meta<typeof SignInPage> = {
  title: "Pages/Sign In Page/Email with Singpass Sign In Page",
  component: SignInPage,
  parameters: {
    loginState: false,
    growthbook: [createSingpassEnabledGbParameters(true)],
    msw: {
      handlers: [
        meHandlers.unauthorized(),
        authEmailHandlers.login({
          email: VALID_AUTH_EMAIL,
          otpPrefix: "TST",
        }),
        authEmailHandlers.verifyOtp.default(),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof SignInPage>

export const Default: Story = {
  parameters: {
    chromatic: withChromaticModes(["gsib", "mobile"]),
  },
}

export const InputValidation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Enter invalid email address", async () => {
      await userEvent.type(await canvas.findByLabelText(/email/i), "test")
    })

    await step("Attempt log in", async () => {
      const submitBtn = await canvas.findByText(/send/i)
      await expect(submitBtn).toBeDisabled()
    })
  },
}

export const VerifyOTP: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Enter valid email address", async () => {
      await userEvent.type(
        await canvas.findByLabelText(/email/i),
        VALID_AUTH_EMAIL,
      )
    })

    await step("Attempt log in", async () => {
      await userEvent.click(await canvas.findByText(/send/i))
      const expectedLabel = await canvas.findByText(/sent an OTP to/i)
      const otpSubmitBtn = await canvas.findByText(/sign in/i)
      await expect(expectedLabel).toBeInTheDocument()
      await expect(otpSubmitBtn).toBeDisabled()
    })
  },
}
