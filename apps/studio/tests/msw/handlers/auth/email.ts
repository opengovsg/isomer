import { trpcMsw } from "tests/msw/mockTrpc"
import type { VfnStepData } from "~/features/sign-in/components"

import { defaultUser } from "../me"

const emailLoginPostQuery = (vfnStepData: VfnStepData) => 
  trpcMsw.auth.email.login.mutation(() => {
    return vfnStepData
  })


export const authEmailHandlers = {
  login: emailLoginPostQuery,
  verifyOtp: {
    default: () => 
      trpcMsw.auth.email.verifyOtp.mutation(() => defaultUser)
    ,
  },
}
