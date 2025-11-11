import type { Meta, StoryObj } from "@storybook/nextjs"

import { DefaultTrpcError } from "~/components/ErrorBoundary/DefaultTrpcError"

const meta: Meta<typeof DefaultTrpcError> = {
  title: "Pages/Error Boundaries",
  component: DefaultTrpcError,
}

type Story = StoryObj<typeof DefaultTrpcError>
export const NotFound: Story = {
  args: {
    code: "NOT_FOUND",
  },
}

export const InternalServerError: Story = {
  args: {
    code: "INTERNAL_SERVER_ERROR",
  },
}
export default meta
