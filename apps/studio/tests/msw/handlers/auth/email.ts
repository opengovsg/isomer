import type { VfnStepData } from "~/features/sign-in/components"
import { trpcMsw } from "tests/msw/mockTrpc"

import { defaultUser } from "../me"

const emailLoginPostQuery = (vfnStepData: VfnStepData) =>
  trpcMsw.auth.email.login.mutation(() => vfnStepData)

export const authEmailHandlers = {
  login: emailLoginPostQuery,
  verifyOtp: {
    default: () =>
      trpcMsw.auth.email.verifyOtp.mutation(() => ({
        ...defaultUser,
        requiresSingpass: true,
      })),
  },
}
