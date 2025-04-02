import { MOCK_TEST_EMAIL, MOCK_TEST_USER_NAME } from "tests/msw/constants"
import { trpcMsw } from "tests/msw/mockTrpc"

export const authSingpassHandlers = {
  getName: {
    newUser: () => {
      return trpcMsw.auth.singpass.getName.query((_input) => {
        return {
          isNewUser: true,
          name: MOCK_TEST_EMAIL,
        }
      })
    },
    existingUser: () => {
      return trpcMsw.auth.singpass.getName.query((_input) => {
        return {
          isNewUser: false,
          name: MOCK_TEST_EMAIL,
        }
      })
    },
    existingUserWithName: () => {
      return trpcMsw.auth.singpass.getName.query((_input) => {
        return {
          isNewUser: false,
          name: MOCK_TEST_USER_NAME,
        }
      })
    },
  },
  callback: {
    default: () => {
      return trpcMsw.auth.singpass.callback.query((_input) => {
        return {
          isNewUser: true,
          redirectUrl: "/",
        }
      })
    },
  },
}
