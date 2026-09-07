import { MOCK_TEST_EMAIL, MOCK_TEST_USER_NAME } from "tests/msw/constants"
import { trpcMsw } from "tests/msw/mockTrpc"

export const authSingpassHandlers = {
  callback: {
    default: () =>
      trpcMsw.auth.singpass.callback.query((_input) => ({
        isNewUser: true,
        redirectUrl: "/",
      })),
  },
  getUserProps: {
    existingUser: () =>
      trpcMsw.auth.singpass.getUserProps.query((_input) => ({
        isNewUser: false,
        name: MOCK_TEST_EMAIL,
      })),
    existingUserWithName: () =>
      trpcMsw.auth.singpass.getUserProps.query((_input) => ({
        isNewUser: false,
        name: MOCK_TEST_USER_NAME,
      })),
    newUser: () =>
      trpcMsw.auth.singpass.getUserProps.query((_input) => ({
        isNewUser: true,
        name: MOCK_TEST_EMAIL,
      })),
  },
}
